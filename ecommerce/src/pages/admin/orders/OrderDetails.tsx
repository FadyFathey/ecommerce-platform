import { useEffect, useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { Link, useParams } from 'react-router-dom'
import { getOrderById, getOrderItems, updateOrderStatus, cancelOrder, refundOrder } from '../../../services/orderService'
import type { Order, OrderItem, OrderStatus } from '../../../types/orderTypes'
import toast from 'react-hot-toast'
import pro1 from '../../../assets/prodcuts/prod1.png'

const formatMoney = (cents: number, currency: string) => `${(cents / 100).toFixed(2)} ${currency}`

const OrderDetails = () => {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        setLoading(true)
        const [orderData, itemData] = await Promise.all([getOrderById(id), getOrderItems(id)])
        if (!orderData) {
          toast.error('Order not found')
          return
        }
        setOrder(orderData)
        setItems(itemData)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleStatusChange = async (status: OrderStatus) => {
    if (!id) return
    setUpdating(true)
    try {
      await updateOrderStatus(id, status)
      setOrder((prev) => (prev ? { ...prev, status } : prev))
      toast.success('Status updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!id || !order) return
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return
    }
    setCancelling(true)
    try {
      await cancelOrder(id)
      setOrder((prev) => (prev ? { ...prev, status: 'cancelled', payment_status: 'cancelled' } : prev))
      toast.success('Order cancelled')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const handleRefund = async () => {
    if (!id || !order?.payment_intent_id) return
    if (!confirm('Are you sure you want to refund this order? This will process a refund through Stripe.')) {
      return
    }
    setRefunding(true)
    try {
      await refundOrder(id, order.payment_intent_id)
      setOrder((prev) => (prev ? { ...prev, payment_status: 'refunded', status: 'cancelled' } : prev))
      toast.success('Refund processed successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process refund')
    } finally {
      setRefunding(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <p className="text-gray-600">Loading order...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-8">
          <p className="text-gray-600">Order not found.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link to="/admin/orders" className="hover:text-black transition-colors">
              Orders
            </Link>
            <span>/</span>
            <span>Order #{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={updating}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={() => handleStatusChange(order.status)}
                disabled={updating}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
              {order.status !== 'cancelled' && order.payment_status !== 'refunded' && (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                  {order.payment_status === 'paid' && order.payment_intent_id && (
                    <button
                      onClick={handleRefund}
                      disabled={refunding}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {refunding ? 'Processing...' : 'Refund'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {items.length === 0 ? (
                  <p className="text-gray-600 text-sm">No items</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = pro1
                          }} />
                        ) : (
                          <img src={pro1} alt={item.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
                        <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatMoney(item.price_cents, item.currency)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{order.customer_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{order.customer_email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatMoney(order.subtotal_cents, order.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatMoney(order.shipping_cents, order.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatMoney(order.tax_cents, order.currency)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">{formatMoney(order.total_cents, order.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default OrderDetails