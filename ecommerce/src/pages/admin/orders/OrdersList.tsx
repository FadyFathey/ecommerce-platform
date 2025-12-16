import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import DataTable from '../../../components/admin/DataTable'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getOrders } from '../../../services/orderService'
import type { Order } from '../../../types/orderTypes'

const OrdersList = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await getOrders()
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const orderNumber = order.id.slice(0, 8).toUpperCase()
    const customer = (order.customer_name || order.user_id || 'Guest').toLowerCase()

    const matchesSearch = orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || order.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesDate = !dateFilter || (order.created_at && new Date(order.created_at).toISOString().slice(0,10) === dateFilter)
    
    return matchesSearch && matchesStatus && matchesDate
  })

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

  const columns = [
    {
      header: 'Order Number',
      accessor: (row: Order) => (
        <Link
          to={`/admin/orders/${row.id}`}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          {row.id.slice(0, 8).toUpperCase()}
        </Link>
      ),
    },
    {
      header: 'Customer',
      accessor: (row: Order) => row.customer_name || row.user_id || 'Guest',
    },
    {
      header: 'Date',
      accessor: (row: Order) => row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A',
    },
    {
      header: 'Total',
      accessor: (row: Order) => (
        <span className="font-semibold text-gray-900">
          ${(row.total_cents / 100).toFixed(2)} {row.currency}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Order) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Payment',
      accessor: (row: Order) => (
        <span className="text-sm text-gray-700">{row.payment_status}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: Order) => (
        <Link
          to={`/admin/orders/${row.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View
        </Link>
      ),
    },
  ]

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Orders</h1>
          <p className="text-gray-600 text-sm sm:text-base">View and manage customer orders</p>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search by order number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={filteredOrders} />
            
            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default OrdersList


