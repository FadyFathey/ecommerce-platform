  -- Function to restore stock when order is cancelled/refunded
  CREATE OR REPLACE FUNCTION restore_order_stock(order_uuid UUID)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  DECLARE
    rec RECORD;
  BEGIN
    -- Restore stock for all items in this order
    FOR rec IN
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = order_uuid
    LOOP
      UPDATE products
      SET stock_quantity = COALESCE(stock_quantity, 0) + rec.quantity,
          updated_at = NOW()
      WHERE id = rec.product_id;
    END LOOP;
  END;
  $$;

  GRANT EXECUTE ON FUNCTION restore_order_stock(UUID) TO authenticated;

