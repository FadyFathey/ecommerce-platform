import AdminLayout from '../../../components/admin/AdminLayout'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { uploadProductImage, validateImageFile } from '../../../services/storageService'
import { createProduct, updateProduct, getProductById } from '../../../services/productService'
import toast from 'react-hot-toast'
import { supabase } from '../../../lib/supabase'

const ProductForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    status: 'active',
    sku: '',
    stockQuantity: '',
    shortDescription: '',
    isFeatured: false,
    isNew: false,
  })
  
  // Image upload state (support multiple images)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null) // main image
  const [extraImageUrls, setExtraImageUrls] = useState<string[]>([]) // gallery images
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([])
  
  // Variants state
  const [variants, setVariants] = useState<Array<{
    id: string
    size: string
    color: string
    stock: string
  }>>([{ id: '1', size: '', color: '', stock: '0' }])

  // Load categories and product data if editing
  useEffect(() => {
    const loadData = async () => {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name')
      
      if (categoriesData) {
        setCategories(categoriesData)
      }

      // Load product data if editing
      if (isEditMode && id) {
        try {
          const product = await getProductById(id)
          if (product) {
            setFormData({
              name: product.name,
              slug: product.slug,
              description: product.description || '',
              price: (product.price_cents / 100).toFixed(2),
              originalPrice: product.original_price_cents ? (product.original_price_cents / 100).toFixed(2) : '',
              category: product.category_id,
              status: product.status || 'active',
              sku: product.sku || '',
              stockQuantity: product.stock_quantity?.toString() || '0',
              shortDescription: product.short_description || '',
              isFeatured: product.is_featured || false,
              isNew: product.is_new || false,
            })
            setImageUrl(product.image_url)
            if (product.image_urls && Array.isArray(product.image_urls)) {
              setExtraImageUrls(product.image_urls)
            }
          }
        } catch (error) {
          toast.error('Failed to load product data')
        }
      }
    }
    loadData()
  }, [id, isEditMode])

  // Handle file selection (multiple)
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      files.forEach((file) => validateImageFile(file))
      setSelectedFiles(files)

      // Create previews for all images
      const newPreviews: string[] = []
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          newPreviews.push(reader.result as string)
          // When all readers finished, update state once
          if (newPreviews.length === files.length) {
            setImagePreviews(newPreviews)
          }
        }
        reader.readAsDataURL(file)
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid file')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length === 0) return

    try {
      files.forEach((file) => validateImageFile(file))
      setSelectedFiles(files)

      const newPreviews: string[] = []
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          newPreviews.push(reader.result as string)
          if (newPreviews.length === files.length) {
            setImagePreviews(newPreviews)
          }
        }
        reader.readAsDataURL(file)
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid file')
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedFiles([])
    setImagePreviews([])
    setImageUrl(null)
    setExtraImageUrls([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle form input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle variant changes
  const handleVariantChange = (variantId: string, field: 'size' | 'color' | 'stock', value: string) => {
    setVariants(prev => prev.map(variant => 
      variant.id === variantId ? { ...variant, [field]: value } : variant
    ))
  }

  // Add new variant
  const handleAddVariant = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() // Prevent form submission
    e.stopPropagation()
    setVariants(prev => [...prev, {
      id: Date.now().toString(),
      size: '',
      color: '',
      stock: '0'
    }])
  }

  // Remove variant
  const handleRemoveVariant = (variantId: string) => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter(variant => variant.id !== variantId))
    } else {
      toast.error('At least one variant is required')
    }
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.slug || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      let finalImageUrl = imageUrl
      let galleryUrls = extraImageUrls

      // Upload images if new files are selected
      if (selectedFiles.length > 0) {
        setIsUploading(true)
        try {
          const uploadedUrls: string[] = []
          for (const file of selectedFiles) {
            const url = await uploadProductImage(file, id)
            uploadedUrls.push(url)
          }

          // First image becomes the main image, rest go to gallery
          finalImageUrl = uploadedUrls[0] || null
          galleryUrls = uploadedUrls.slice(1)

          setImageUrl(finalImageUrl)
          setExtraImageUrls(galleryUrls)
          toast.success('Images uploaded successfully')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to upload images')
          setIsSubmitting(false)
          setIsUploading(false)
          return
        } finally {
          setIsUploading(false)
        }
      }

      // Convert price to cents (database stores price in cents)
      const priceCents = Math.round(parseFloat(formData.price) * 100)
      
      // Convert original price to cents if provided
      const originalPriceCents = formData.originalPrice 
        ? Math.round(parseFloat(formData.originalPrice) * 100) 
        : null

      // Prepare product data for Supabase
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || '',
        short_description: formData.shortDescription || null,
        price_cents: priceCents,
        original_price_cents: originalPriceCents,
        currency: 'USD',
        image_url: finalImageUrl,
        image_urls: galleryUrls,
        category_id: formData.category,
        status: formData.status,
        sku: formData.sku || null,
        stock_quantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : 0,
        is_featured: formData.isFeatured,
        is_new: formData.isNew,
      }

      // Save to Supabase
      if (isEditMode && id) {
        await updateProduct(id, productData)
        toast.success('Product updated successfully')
      } else {
        await createProduct(productData)
        toast.success('Product created successfully')
      }
      
      navigate('/admin/products')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save product')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link to="/admin/products" className="hover:text-black transition-colors">
              Products
            </Link>
            <span>/</span>
            <span>{isEditMode ? 'Edit Product' : 'New Product'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {isEditMode ? 'Update product information' : 'Fill in the details to create a new product'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="product-slug"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">URL-friendly version of the name</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Enter full product description"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <textarea
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Brief description for product cards (optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Used in product cards and listings</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        name="originalPrice"
                        value={formData.originalPrice}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Leave empty if no discount</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="PROD-001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Stock Keeping Unit (optional)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

            {/* Product Variants */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Variant
                </button>
              </div>
              <div className="space-y-4">
                {variants.map((variant) => (
                  <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                        <select
                          value={variant.size}
                          onChange={(e) => handleVariantChange(variant.id, 'size', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        >
                          <option value="">Select size</option>
                          <option value="Small">Small</option>
                          <option value="Medium">Medium</option>
                          <option value="Large">Large</option>
                          <option value="X-Large">X-Large</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => handleVariantChange(variant.id, 'color', e.target.value)}
                          placeholder="Color name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => handleVariantChange(variant.id, 'stock', e.target.value)}
                          placeholder="0"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category & Status */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Category & Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured Product</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isNew"
                      checked={formData.isNew}
                      onChange={(e) => setFormData(prev => ({ ...prev, isNew: e.target.checked }))}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <span className="text-sm font-medium text-gray-700">New Arrival</span>
                  </label>
                </div>
              </div>
            </div>

              {/* Product Images */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
                <div className="space-y-4">
                  {imagePreviews.length > 0 || imageUrl ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={imagePreviews[0] || imageUrl || ''}
                          alt="Product preview"
                          className="w-full h-64 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          title="Remove images"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Thumbnails for additional images */}
                      {(imagePreviews.length > 1 || extraImageUrls.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {[...imagePreviews.slice(1), ...extraImageUrls].map((preview, idx) => (
                            <img
                              key={idx}
                              src={preview}
                              alt={`Additional image ${idx + 2}`}
                              className="w-16 h-16 object-cover rounded-md border border-gray-200"
                            />
                          ))}
                        </div>
                      )}

                      {!imagePreviews.length && imageUrl && (
                        <div className="mt-1 text-xs text-gray-500">
                          Current images from Supabase storage
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WebP up to 10MB</p>
                      <button
                        type="button"
                        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                  {isUploading && (
                    <div className="text-center text-sm text-gray-600">
                      Uploading image...
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
                  </button>
                  <Link
                    to="/admin/products"
                    className="block w-full px-4 py-2 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

export default ProductForm


