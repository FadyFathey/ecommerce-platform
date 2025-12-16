import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import StatsCard from '../../components/admin/StatsCard'
import { getProducts } from '../../services/productService'
import { supabase } from '../../lib/supabase'
import type { Product } from '../../types/productTypes'

const AdminHome = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
  })
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load products
      const products = await getProducts()
      const activeProducts = products.filter(p => p.status === 'active' && !p.deleted_at)
      const lowStock = products.filter(p => 
        (p.stock_quantity || 0) > 0 && 
        (p.stock_quantity || 0) <= (p.low_stock_threshold || 10) &&
        p.status === 'active'
      )

      setLowStockProducts(lowStock.slice(0, 5))

      // Try to load orders (if orders table exists)
      let ordersCount = 0
      let revenue = 0
      let recentOrdersData: any[] = []
      
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        if (!ordersError && ordersData) {
          ordersCount = ordersData.length
          revenue = ordersData.reduce((sum, order) => sum + (order.total_cents || 0), 0) / 100
          recentOrdersData = ordersData
        }
      } catch (e) {
        // Orders table might not exist yet
        console.log('Orders table not available')
      }

      // Try to load users count
      let usersCount = 0
      try {
        const { count, error: usersError } = await supabase
          .from('auth.users')
          .select('*', { count: 'exact', head: true })

        if (!usersError && count) {
          usersCount = count
        } else {
          // Alternative: count from profiles table if exists
          const { count: profileCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
          
          if (profileCount) usersCount = profileCount
        }
      } catch (e) {
        console.log('Users count not available')
      }

      setStats({
        totalProducts: activeProducts.length,
        totalOrders: ordersCount,
        totalRevenue: revenue,
        activeUsers: usersCount,
      })
      setRecentOrders(recentOrdersData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600 text-sm sm:text-base">Welcome back! Here's what's happening with your store today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatsCard
            title="Total Products"
            value={loading ? "..." : stats.totalProducts.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatsCard
            title="Total Orders"
            value={loading ? "..." : stats.totalOrders.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatsCard
            title="Total Revenue"
            value={loading ? "..." : `$${stats.totalRevenue.toFixed(2)}`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Active Users"
            value={loading ? "..." : stats.activeUsers.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Orders</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {loading ? (
                  <p className="text-sm text-gray-600 text-center py-4">Loading...</p>
                ) : recentOrders.length === 0 ? (
                  <p className="text-sm text-gray-600 text-center py-4">No recent orders</p>
                ) : (
                  recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Order #{order.order_number || order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.customer_name || 'Customer'} • {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ${((order.total_cents || 0) / 100).toFixed(2)}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status || 'Pending'}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
                <div className="text-center pt-2">
                  <Link to="/admin/orders" className="text-sm text-gray-600 hover:text-black transition-colors">
                    View all orders →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Low Stock Alerts</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {loading ? (
                  <p className="text-sm text-gray-600 text-center py-4">Loading...</p>
                ) : lowStockProducts.length === 0 ? (
                  <p className="text-sm text-gray-600 text-center py-4">No low stock alerts</p>
                ) : (
                  lowStockProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/admin/products/${product.id}/edit`}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500 mt-1">SKU: {product.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">{product.stock_quantity || 0} units</p>
                        <p className="text-xs text-gray-500 mt-1">Remaining</p>
                      </div>
                    </Link>
                  ))
                )}
                <div className="text-center pt-2">
                  <Link to="/admin/products" className="text-sm text-gray-600 hover:text-black transition-colors">
                    View all products →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Link
              to="/admin/products/new"
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Add Product</span>
            </Link>
            <Link
              to="/admin/orders"
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">View Orders</span>
            </Link>
            <Link
              to="/admin/categories/new"
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Add Category</span>
            </Link>
            <Link
              to="/admin/users"
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Manage Users</span>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminHome

