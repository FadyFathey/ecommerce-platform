export type OrderStatus = 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'requires_action' | 'paid' | 'failed' | 'refunded' | 'cancelled'

export interface Order {
  id: string
  user_id: string | null
  status: OrderStatus
  payment_status: PaymentStatus
  payment_provider?: string | null
  payment_intent_id?: string | null
  currency: string
  subtotal_cents: number
  shipping_cents: number
  tax_cents: number
  total_cents: number
  customer_email?: string | null
  customer_name?: string | null
  shipping_address?: Record<string, unknown> | null
  billing_address?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id?: string | null
  name: string
  sku?: string | null
  image_url?: string | null
  price_cents: number
  currency: string
  quantity: number
  created_at: string
}

