import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Banner from '../components/banner'
import { NavBar } from '../components/NavBar'
import { supabase } from '../lib/supabase'
import SectionHeading from '../components/SectionHeading'
import type { Product } from '../types/productTypes'
import { getProductsByCategory } from '../services/productService'

type CategoryRecord = {
  id: string
  name: string
  slug: string
  description?: string | null
  image_url?: string | null
}

const CategoryDetails = () => {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<CategoryRecord | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [priceMin, setPriceMin] = useState<string>('')
  const [priceMax, setPriceMax] = useState<string>('')
  const [inStockOnly, setInStockOnly] = useState(false)

  useEffect(() => {
    const loadCategoryAndProducts = async () => {
      if (!slug) return
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, description, image_url')
          .eq('slug', slug)
          .single()

        if (error) throw error
        if (!data) throw new Error('Category not found')

        setCategory(data as CategoryRecord)

        const fetchedProducts = await getProductsByCategory(data.id)
        setProducts(fetchedProducts)
        setFilteredProducts(fetchedProducts)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load category')
      } finally {
        setLoading(false)
      }
    }

    loadCategoryAndProducts()
  }, [slug])

  const colorOptions = [
    { label: 'Green', value: '#22c55e', matchTokens: ['green', '22c55e'] },
    { label: 'Red', value: '#ef4444', matchTokens: ['red', 'ef4444'] },
    { label: 'Yellow', value: '#eab308', matchTokens: ['yellow', 'eab308'] },
    { label: 'Orange', value: '#f97316', matchTokens: ['orange', 'f97316'] },
    { label: 'Sky', value: '#0ea5e9', matchTokens: ['sky', 'blue', '0ea5e9'] },
    { label: 'Blue', value: '#1e3a8a', matchTokens: ['blue', 'navy', '1e3a8a'] },
    { label: 'Purple', value: '#7c3aed', matchTokens: ['purple', '7c3aed'] },
    { label: 'Pink', value: '#ec4899', matchTokens: ['pink', 'ec4899'] },
    { label: 'White', value: '#ffffff', matchTokens: ['white', 'fff'] },
  ]

  const sizeOptions = [
    'XX-Small',
    'X-Small',
    'Small',
    'Medium',
    'Large',
    'X-Large',
    'XX-Large',
    '3X-Large',
    '4X-Large',
  ]

  const normalizeToken = (value: string | null | undefined) =>
    value?.toString().trim().toLowerCase().replace(/[#\s_-]+/g, '') || ''

  // Accept optional color-related fields even if Product typing misses them
  const matchesColor = (product: Product & { color?: string | null; colors?: string[] | null; tags?: string[] | null }) => {
    if (!selectedColor) return true

    const selectedTokens =
      colorOptions.find((c) => c.value === selectedColor)?.matchTokens || [selectedColor]
    const normalizedSelected = selectedTokens.map(normalizeToken)

    const productColorTokens = [
      product.color,
      ...(product.colors || []),
      ...(product.tags || []),
    ]
      .filter(Boolean)
      .map((token) => normalizeToken(token))

    return productColorTokens.some((token) =>
      normalizedSelected.some((selected) => token.includes(selected) || selected.includes(token))
    )
  }

  const matchesSize = (
    product: Product & { size?: string | null; sizes?: string[] | null; available_sizes?: string[] | null }
  ) => {
    if (!selectedSize) return true
    const target = normalizeToken(selectedSize)

    const productSizes = [
      product.size,
      ...(product.sizes || []),
      ...(product.available_sizes || []),
    ]
      .filter(Boolean)
      .map((token) => normalizeToken(token))

    // If the product has no size data, exclude it when a size is selected
    if (productSizes.length === 0) return false

    return productSizes.some((token) => token === target)
  }

  const matchesPrice = (product: Product) => {
    const min = priceMin ? Number(priceMin) * 100 : null
    const max = priceMax ? Number(priceMax) * 100 : null

    if (min !== null && Number.isFinite(min) && product.price_cents < min) return false
    if (max !== null && Number.isFinite(max) && product.price_cents > max) return false
    return true
  }

  const matchesAvailability = (product: Product) => {
    if (!inStockOnly) return true
    return (product.stock_quantity || 0) > 0 && product.status === 'active'
  }

  const applyFilters = () => {
    const next = products.filter(
      (product) =>
        matchesColor(product) && matchesSize(product) && matchesPrice(product) && matchesAvailability(product)
    )
    setFilteredProducts(next)
  }

  useEffect(() => {
    applyFilters()
  }, [products, selectedColor, selectedSize])

  const clearFilters = () => {
    setSelectedColor(null)
    setSelectedSize(null)
    setPriceMin('')
    setPriceMax('')
    setInStockOnly(false)
    setFilteredProducts(products)
  }

  const hasActiveFilters =
    selectedColor !== null || selectedSize !== null || priceMin !== '' || priceMax !== '' || inStockOnly

  const heroBg =
    category?.image_url ||
    'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #111827 100%)'

  return (
    <div className="min-h-screen bg-white">
      <Banner />
      <NavBar />

      <main className="pt-[110px] md:pt-[130px] pb-16">
        {loading ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-gray-600">Loading category...</p>
          </div>
        ) : error ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-red-600">{error}</p>
            <Link to="/categories" className="text-sm text-blue-600 hover:underline">
              Back to categories
            </Link>
          </div>
        ) : category ? (
          <>
            {/* Hero */}
            <section className="mb-10 sm:mb-12">
              <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] mx-4 sm:mx-6 lg:mx-10 shadow-lg">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${heroBg})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/45 to-black/25" />
                <div className="relative px-6 sm:px-10 lg:px-14 py-14 sm:py-18 lg:py-20 text-white space-y-4">
                  <p className="text-sm sm:text-base uppercase tracking-[0.2em] text-white/80">
                    Category
                  </p>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                    {category.name}
                  </h1>
                  {category.description && (
                    <p className="max-w-3xl text-base sm:text-lg text-white/85">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Products */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <SectionHeading
                  title={`${filteredProducts.length} Products`}
                  className="mb-0"
                />
                <Link to="/categories" className="text-sm text-blue-600 hover:underline">
                  Back to categories
                </Link>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Filters */}
                <div className="lg:w-72 xl:w-80 flex-shrink-0">
                  <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 shadow-sm lg:sticky lg:top-28">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Filter</h3>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-3">Price</p>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            min="0"
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value)}
                            placeholder="Min"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/60"
                          />
                          <input
                            type="number"
                            min="0"
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                            placeholder="Max"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/60"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          id="inStock"
                          type="checkbox"
                          checked={inStockOnly}
                          onChange={(e) => setInStockOnly(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/70"
                        />
                        <label htmlFor="inStock" className="text-sm text-gray-800">
                          In stock only
                        </label>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-3">Color</p>
                        <div className="flex flex-wrap gap-3">
                          {colorOptions.map((color) => {
                            const isSelected = selectedColor === color.value
                            return (
                              <button
                                key={color.value}
                                onClick={() =>
                                  setSelectedColor((prev) =>
                                    prev === color.value ? null : color.value
                                  )
                                }
                                className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                                  isSelected
                                    ? 'border-black shadow-[0_0_0_3px_rgba(0,0,0,0.08)]'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                style={{ backgroundColor: color.value }}
                                aria-label={color.label}
                              >
                                {isSelected && (
                                  <span className="absolute inset-0 flex items-center justify-center text-white">
                                    ✓
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-3">Size</p>
                        <div className="flex flex-wrap gap-3">
                          {sizeOptions.map((size) => {
                            const isSelected = selectedSize === size
                            return (
                              <button
                                key={size}
                                onClick={() =>
                                  setSelectedSize((prev) => (prev === size ? null : size))
                                }
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                                  isSelected
                                    ? 'bg-black text-white border-black shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)]'
                                    : 'bg-gray-100 text-gray-900 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {size}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                          onClick={clearFilters}
                          className="w-full lg:w-auto px-6 py-3 rounded-full border border-gray-300 text-gray-800 text-sm font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
                        >
                          Clear Filters
                        </button>
                        <button
                          onClick={applyFilters}
                          className="w-full lg:w-auto px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors"
                        >
                          Apply Filter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product grid */}
                <div className="flex-1">
                  {filteredProducts.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 p-6 text-gray-600 bg-gray-50">
                      {products.length === 0
                        ? 'No products found in this category yet.'
                        : 'No products match the selected filters.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.map((product) => (
                        <Link
                          to={`/product/${product.id}`}
                          key={product.id}
                          className="group rounded-2xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-shadow"
                        >
                          <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                            <img
                              src={product.image_url || ''}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src =
                                  'https://placehold.co/600x800/ededed/999?text=No+Image'
                              }}
                            />
                          </div>
                          <div className="p-4 space-y-2">
                            <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            <div className="text-lg font-bold text-gray-900">
                              ${(product.price_cents / 100).toFixed(2)}{' '}
                              <span className="text-xs text-gray-500">
                                {product.currency || 'USD'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}

export default CategoryDetails

