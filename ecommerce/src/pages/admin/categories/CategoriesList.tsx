import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import DataTable from '../../../components/admin/DataTable'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { getProducts } from '../../../services/productService'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  slug: string
  productCount: number
  createdAt: string
}

const CategoriesList = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      
      // Load categories from Supabase
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        throw error
      }

      // Load products to count per category
      const products = await getProducts()
      
      // Count products per category
      const categoriesWithCounts = (categoriesData || []).map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        productCount: products.filter(p => p.category_id === category.id).length,
        createdAt: category.created_at ? new Date(category.created_at).toLocaleDateString() : 'N/A',
      }))

      setCategories(categoriesWithCounts)
    } catch (error) {
      toast.error('Failed to load categories')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    // Check if category has products
    const products = await getProducts()
    const productsInCategory = products.filter(p => p.category_id === id)
    
    if (productsInCategory.length > 0) {
      toast.error(`Cannot delete category. ${productsInCategory.length} product(s) are using it.`)
      return
    }

    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Category deleted successfully')
      loadCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category')
    }
  }

  // Filter categories
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      header: 'Category Name',
      accessor: (row: Category) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">/{row.slug}</p>
        </div>
      ),
    },
    {
      header: 'Products',
      accessor: (row: Category) => (
        <span className="text-gray-900">{row.productCount} products</span>
      ),
    },
    {
      header: 'Created',
      accessor: 'createdAt' as keyof Category,
    },
    {
      header: 'Actions',
      accessor: (row: Category) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/categories/${row.id}/edit`}
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Categories</h1>
            <p className="text-gray-600 text-sm sm:text-base">Organize your products by categories</p>
          </div>
          <Link
            to="/admin/categories/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="relative max-w-md">
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
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No categories found</p>
            <Link
              to="/admin/categories/new"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Create your first category →
            </Link>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredCategories} />
        )}
      </div>
    </AdminLayout>
  )
}

export default CategoriesList


