-- Fix: Stock should only be decremented after successful payment, not on order creation
-- This migration updates create_order_with_items to NOT decrement stock
-- Stock will be decremented via webhook after payment succeeds

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

  -- Validate items and compute subtotal (check stock availability but DON'T decrement yet)
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

    -- Check stock availability but don't decrement (will happen after payment)
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

  -- Insert order items (but DON'T decrement stock - that happens after payment)
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
    
    -- REMOVED: Stock decrement - this will happen via webhook after payment succeeds
  END LOOP;

  RETURN QUERY
  SELECT v_order_id AS order_id, 'pending', v_subtotal, 0, v_shipping_cents, v_total, v_currency;
END;
$$;

-- Function to decrement stock after payment succeeds (called by webhook)
CREATE OR REPLACE FUNCTION decrement_order_stock(order_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Decrement stock for all items in this order
  FOR rec IN
    SELECT product_id, quantity
    FROM order_items
    WHERE order_id = order_uuid
  LOOP
    UPDATE products
    SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - rec.quantity),
        updated_at = NOW()
    WHERE id = rec.product_id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_order_stock(UUID) TO authenticated;

