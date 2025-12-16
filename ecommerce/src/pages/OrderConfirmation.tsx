import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import Banner from '../components/banner'
import { getOrderById, getOrderItems } from '../services/orderService'
import type { Order, OrderItem } from '../types/orderTypes'
import toast from 'react-hot-toast'
import { useAppSelector } from '../store/hooks'

const formatMoney = (cents: number, currency: string) => `${(cents / 100).toFixed(2)} ${currency}`

const OrderConfirmation = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const userSession = useAppSelector((state) => state.auth.session)
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userSession) {
      toast.error('Please login to view order details')
      navigate('/login')
      return
    }
    if (!id) {
      navigate('/orders')
      return
    }
    loadOrder()
  }, [id, userSession, navigate])

  const loadOrder = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [orderData, itemData] = await Promise.all([getOrderById(id), getOrderItems(id)])
      if (!orderData) {
        toast.error('Order not found')
        navigate('/orders')
        return
      }
      // Verify user owns this order
      if (orderData.user_id !== userSession?.user?.id) {
        toast.error('Access denied')
        navigate('/orders')
        return
      }
      setOrder(orderData)
      setItems(itemData)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load order')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Banner />
        <NavBar />
        <div className="pt-[102px] md:pt-[118px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <p className="text-gray-600">Loading order...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white">
        <Banner />
        <NavBar />
        <div className="pt-[102px] md:pt-[118px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <p className="text-gray-600">Order not found.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Banner />
      <NavBar />
      <div className="pt-[102px] md:pt-[118px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Success Message */}
          {order.payment_status === 'paid' && order.status === 'paid' && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-green-900">Order Confirmed!</h3>
                <p className="text-sm text-green-700">Your payment was successful. We'll send you an email confirmation shortly.</p>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link to="/orders" className="hover:text-black transition-colors">
                My Orders
              </Link>
              <span>/</span>
              <span>Order #{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="text-sm text-gray-600">
                  Payment: <span className="font-medium">{order.payment_status}</span>
                </span>
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
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
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

              {/* Actions */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-2">
                  <Link
                    to="/orders"
                    className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    View All Orders
                  </Link>
                  <Link
                    to="/"
                    className="block w-full text-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation

