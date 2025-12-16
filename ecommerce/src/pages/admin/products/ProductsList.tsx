import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import DataTable from '../../../components/admin/DataTable'
import { Link } from 'react-router-dom'
import { getProducts, deleteProduct } from '../../../services/productService'
import { supabase } from '../../../lib/supabase'
import type { Product } from '../../../types/productTypes'
import toast from 'react-hot-toast'
import pro1 from '../../../assets/prodcuts/prod1.png'

interface ProductWithCategory extends Product {
  category_name?: string
}

const ProductsList = () => {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  // Load products and categories
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')
      
      if (categoriesData) {
        setCategories(categoriesData)
      }

      // Load products with category names
      const allProducts = await getProducts()
      
      // Get category names for each product
      const productsWithCategories = await Promise.all(
        allProducts.map(async (product) => {
          if (product.category_id && categoriesData) {
            const category = categoriesData.find(c => c.id === product.category_id)
            return { ...product, category_name: category?.name || 'Uncategorized' }
          }
          return { ...product, category_name: 'Uncategorized' }
        })
      )
      
      setProducts(productsWithCategories)
    } catch (error) {
      toast.error('Failed to load products')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteProduct(id)
      toast.success('Product deleted successfully')
      loadData() // Reload products
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product')
    }
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || product.category_id === categoryFilter
    const matchesStatus = !statusFilter || 
      (statusFilter === 'in-stock' && (product.stock_quantity || 0) > 0 && product.status === 'active') ||
      (statusFilter === 'out-of-stock' && ((product.stock_quantity || 0) === 0 || product.status !== 'active'))
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusDisplay = (product: ProductWithCategory) => {
    if (product.status === 'inactive' || product.status === 'draft' || product.status === 'archived') {
      return { text: product.status.charAt(0).toUpperCase() + product.status.slice(1), color: 'bg-gray-100 text-gray-800' }
    }
    if ((product.stock_quantity || 0) === 0) {
      return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    }
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  const columns = [
    {
      header: 'Image',
      accessor: (row: ProductWithCategory) => {
        // Get image from multiple sources (priority: image_url > thumbnail_url > image_urls[0] > fallback)
        const imageSrc = row.image_url || 
                        row.thumbnail_url || 
                        (row.image_urls && Array.isArray(row.image_urls) && row.image_urls.length > 0 ? row.image_urls[0] : null) ||
                        pro1
        
        return (
          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            <img 
              src={imageSrc} 
              alt={row.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                if (target.src !== pro1) {
                  target.src = pro1
                }
              }}
            />
          </div>
        )
      },
    },
    {
      header: 'Product Name',
      accessor: (row: ProductWithCategory) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">SKU: {row.sku || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (row: ProductWithCategory) => row.category_name || 'Uncategorized',
    },
    {
      header: 'Price',
      accessor: (row: ProductWithCategory) => (
        <div>
          <p className="font-medium text-gray-900">
            ${((row.price_cents || 0) / 100).toFixed(2)}
          </p>
          {row.original_price_cents && row.original_price_cents > row.price_cents && (
            <p className="text-xs text-gray-400 line-through">
              ${((row.original_price_cents) / 100).toFixed(2)}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Stock',
      accessor: (row: ProductWithCategory) => (
        <span className={(row.stock_quantity || 0) > 10 ? 'text-gray-900' : 'text-red-600 font-medium'}>
          {row.stock_quantity || 0} units
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: ProductWithCategory) => {
        const status = getStatusDisplay(row)
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
            {status.text}
          </span>
        )
      },
    },
    {
      header: 'Actions',
      accessor: (row: ProductWithCategory) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/products/${row.id}/edit`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </Link>
          <button 
            onClick={() => handleDelete(row.id, row.name)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Products</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage your product inventory</p>
          </div>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        </div>

        {/* Filters and Search */}
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
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No products found</p>
            <Link
              to="/admin/products/new"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Create your first product →
            </Link>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={filteredProducts} />
            
            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default ProductsList


