import { supabase } from '../lib/supabase'
import type { CartItem } from '../types/productTypes'
import type { Order, OrderItem, OrderStatus } from '../types/orderTypes'

export interface CheckoutResult {
  orderId: string
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  currency: string
}

// Create order via server-side function that revalidates price/stock
export const createOrderFromCart = async (items: CartItem[]): Promise<CheckoutResult> => {
  const payload = {
    items: items.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    })),
  }

  const { data, error } = await supabase.rpc('create_order_with_items', {
    order_input: payload,
  })

  if (error) {
    throw new Error(error.message || 'Failed to create order')
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.id) {
    throw new Error('Invalid response when creating order')
  }

  return {
    orderId: row.id,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    taxCents: row.tax_cents,
    totalCents: row.total_cents,
    currency: row.currency,
  }
}

export interface PaymentIntentResult {
  clientSecret: string
  orderId: string
  amount: number
  currency: string
}

// Create PaymentIntent + order via Edge Function (Stripe integration)
export const createPaymentIntentFromCart = async (items: CartItem[]): Promise<PaymentIntentResult> => {
  try {
    const payload = {
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    }

    console.log('orderService.createPaymentIntentFromCart: invoking function', payload)

    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: payload,
    })

    console.log('orderService.createPaymentIntentFromCart: response', { data, error })

    if (error) {
      // Surface both the Edge Function error payload and supabase-js error message if present
      const message =
        (data && (data as any).error) ||
        error.message ||
        'Failed to create payment intent'
      throw new Error(message)
    }

    if (!data?.clientSecret || !data?.orderId) {
      console.error('orderService.createPaymentIntentFromCart: invalid response shape', data)
      throw new Error('Invalid response from payment intent')
    }

    return {
      clientSecret: data.clientSecret,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
    }
  } catch (err) {
    console.error('orderService.createPaymentIntentFromCart: unexpected error', err)
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Unexpected error while creating payment intent')
  }
}

export const getOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      // Some older databases may not have payment_provider column; omit it to avoid 42703 errors
      'id, user_id, status, payment_status, payment_intent_id, currency, subtotal_cents, shipping_cents, tax_cents, total_cents, customer_email, customer_name, created_at, updated_at'
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Failed to load orders')
  }

  return data || []
}

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message || 'Failed to load order')
  }

  return data
}

export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message || 'Failed to load order items')
  }

  return data || []
}

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (error) {
    throw new Error(error.message || 'Failed to update status')
  }
}

export const cancelOrder = async (orderId: string): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', payment_status: 'cancelled' })
    .eq('id', orderId)
  if (error) {
    throw new Error(error.message || 'Failed to cancel order')
  }
}

export const refundOrder = async (orderId: string, paymentIntentId: string): Promise<void> => {
  // Call Edge Function to process refund via Stripe
  const { data, error } = await supabase.functions.invoke('process-refund', {
    body: { orderId, paymentIntentId },
  })

  if (error) {
    const message = (data && (data as any).error) || error.message || 'Failed to process refund'
    throw new Error(message)
  }
}

