-- Migration: Orders schema, secure product policies, and checkout helper
-- Run in Supabase SQL Editor

-- Helper: check admin role from auth.users metadata
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_text TEXT;
BEGIN
  SELECT raw_user_meta_data->>'role' INTO role_text
  FROM auth.users
  WHERE id = auth.uid();

  RETURN role_text = 'admin';
END;
$$;

-- =========================
-- Products: tighten RLS to admin-only for writes
-- =========================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop lax policies if they exist
DROP POLICY IF EXISTS "Authenticated users can create products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;

-- Public read of active + not deleted products
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products"
    ON products FOR SELECT
    USING (status = 'active' AND deleted_at IS NULL);

-- Admin-only create/update/delete
DROP POLICY IF EXISTS "Admins can create products" ON products;
CREATE POLICY "Admins can create products"
    ON products FOR INSERT
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products"
    ON products FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products"
    ON products FOR DELETE
    USING (is_admin());

-- =========================
-- Orders schema
-- =========================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','shipped','delivered','cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','requires_action','paid','failed','refunded','cancelled')),
  payment_provider TEXT DEFAULT 'stripe',
  payment_intent_id TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  customer_email TEXT,
  customer_name TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  name TEXT NOT NULL,
  sku TEXT,
  image_url TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- =========================
-- RLS for orders and order_items
-- =========================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Orders: owner or admin can select
DROP POLICY IF EXISTS "Orders select owner or admin" ON orders;
CREATE POLICY "Orders select owner or admin"
  ON orders FOR SELECT
  USING (is_admin() OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

-- Orders: authenticated users can insert for themselves
DROP POLICY IF EXISTS "Orders insert self" ON orders;
CREATE POLICY "Orders insert self"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Orders: admin can update/delete
DROP POLICY IF EXISTS "Orders admin update" ON orders;
CREATE POLICY "Orders admin update"
  ON orders FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Orders admin delete" ON orders;
CREATE POLICY "Orders admin delete"
  ON orders FOR DELETE
  USING (is_admin());

-- Order items: select for owner via parent order or admin
DROP POLICY IF EXISTS "Order items select owner or admin" ON order_items;
CREATE POLICY "Order items select owner or admin"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (is_admin() OR (auth.uid() IS NOT NULL AND o.user_id = auth.uid()))
    )
  );

-- Order items: insert when inserting own order (or admin)
DROP POLICY IF EXISTS "Order items insert with matching order" ON order_items;
CREATE POLICY "Order items insert with matching order"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (is_admin() OR (auth.uid() IS NOT NULL AND o.user_id = auth.uid()))
    )
  );

-- Order items: admin update/delete
DROP POLICY IF EXISTS "Order items admin update" ON order_items;
CREATE POLICY "Order items admin update"
  ON order_items FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Order items admin delete" ON order_items;
CREATE POLICY "Order items admin delete"
  ON order_items FOR DELETE
  USING (is_admin());

-- =========================
-- Checkout helper function: validates price/stock server-side
-- =========================
CREATE OR REPLACE FUNCTION create_order_with_items(order_input JSONB)
RETURNS TABLE (
  order_id UUID,
  status TEXT,
  subtotal_cents INTEGER,
  tax_cents INTEGER,
  shipping_cents INTEGER,
  total_cents INTEGER,
  currency TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_currency TEXT := COALESCE(order_input->>'currency', 'USD');
  v_shipping_cents INTEGER := COALESCE((order_input->>'shipping_cents')::INT, 0);
  v_items JSONB := COALESCE(order_input->'items', '[]'::jsonb);
  v_subtotal INTEGER := 0;
  v_total INTEGER;
  v_order_id UUID;
  v_price_cents INTEGER;
  v_stock INTEGER;
  v_status TEXT;
  rec RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'No items provided';
  END IF;

  -- Validate items and compute subtotal
  FOR rec IN
    SELECT 
      (item->>'product_id')::UUID AS product_id,
      GREATEST(1, COALESCE((item->>'quantity')::INT, 0)) AS qty
    FROM jsonb_array_elements(v_items) AS item
  LOOP
    -- Ensure product exists and is active
    SELECT p.price_cents, p.stock_quantity, p.status
    INTO STRICT v_price_cents, v_stock, v_status
    FROM products p
    WHERE p.id = rec.product_id;

    IF v_status <> 'active' THEN
      RAISE EXCEPTION 'Product not available';
    END IF;

    IF COALESCE(v_stock, 0) < rec.qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %', rec.product_id;
    END IF;

    v_subtotal := v_subtotal + v_price_cents * rec.qty;
  END LOOP;

  v_total := v_subtotal + v_shipping_cents;

  -- Create order
  INSERT INTO orders (
    user_id, status, payment_status, currency,
    subtotal_cents, shipping_cents, tax_cents, total_cents,
    customer_email, customer_name
  )
  VALUES (
    v_user_id, 'pending', 'pending', v_currency,
    v_subtotal, v_shipping_cents, 0, v_total,
    (SELECT email FROM auth.users WHERE auth.users.id = v_user_id),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE auth.users.id = v_user_id)
  )
  RETURNING orders.id INTO v_order_id;

  -- Insert order items and decrement stock
  FOR rec IN
    SELECT 
      (item->>'product_id')::UUID AS product_id,
      GREATEST(1, COALESCE((item->>'quantity')::INT, 0)) AS qty
    FROM jsonb_array_elements(v_items) AS item
  LOOP
    INSERT INTO order_items (
      order_id, product_id, name, sku, image_url,
      price_cents, currency, quantity
    )
    SELECT
      v_order_id,
      p.id,
      p.name,
      p.sku,
      p.image_url,
      p.price_cents,
      v_currency,
      rec.qty
    FROM products p
    WHERE p.id = rec.product_id;

    UPDATE products
    SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - rec.qty),
        updated_at = NOW()
    WHERE id = rec.product_id;
  END LOOP;

  RETURN QUERY
  SELECT v_order_id AS order_id, 'pending', v_subtotal, 0, v_shipping_cents, v_total, v_currency;
END;
$$;

GRANT EXECUTE ON FUNCTION create_order_with_items(JSONB) TO authenticated;

