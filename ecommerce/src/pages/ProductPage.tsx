import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { getProductById, getProductReviews, getRelatedProducts, createProductReview, updateProductReview, deleteProductReview } from '../services/productService'
import type { Product, ProductReview } from '../types/productTypes'
import toast from 'react-hot-toast'
import pro1 from '../assets/prodcuts/prod1.png'
import Banner from '../components/banner'
import { NavBar } from '../components/NavBar'
import { useAppDispatch } from '../store/hooks'
import { addItem } from '../store/slices/cartSlice'

type TabType = 'details' | 'reviews' | 'faqs'

export const ProductPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('Large')
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('reviews')
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null)

  // Get user session from Redux
  const userSession = useSelector((state: RootState) => state.auth.session)
  const loggedUser = useSelector((state: RootState) => state.auth.loggedUser)
  const isLoggedIn = !!userSession

  // Available colors and sizes (in a real app, these would come from product variants)
  const availableColors = ['#4A5D23', '#1B4D3E', '#1E3A5F'] // Dark olive, teal, navy
  const availableSizes = ['Small', 'Medium', 'Large', 'X-Large']

  useEffect(() => {
    if (id) {
      loadProduct()
    }
  }, [id])

  const loadProduct = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const productData = await getProductById(id)
      if (productData) {
        setProduct(productData)
        // Set default color to first available
        if (availableColors.length > 0) {
          setSelectedColor(availableColors[0])
        }
        
        // Load reviews
        try {
          const reviewsData = await getProductReviews(id)
          setReviews(reviewsData)
        } catch (error) {
          console.error('Failed to load reviews:', error)
        }
        
        // Load related products
        try {
          const related = await getRelatedProducts(id, productData.category_id, 4)
          setRelatedProducts(related)
        } catch (error) {
          console.error('Failed to load related products:', error)
        }
      } else {
        toast.error('Product not found')
        navigate('/')
      }
    } catch (error) {
      toast.error('Failed to load product')
      console.error(error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    if ((product.stock_quantity || 0) <= 0 && product.status !== 'active') {
      toast.error('Product is out of stock')
      return
    }

    try {
      setAddingToCart(true)
      dispatch(addItem({ product, quantity, selectedColor, selectedSize }))
      toast.success(`Added ${quantity} item(s) to cart`)
    } catch (error) {
      toast.error('Failed to add to cart')
      console.error(error)
    } finally {
      setAddingToCart(false)
    }
  }

  const getProductImages = (): string[] => {
    if (!product) return [pro1]
    
    const images: string[] = []
    
    // Add main image
    if (product.image_url) {
      images.push(product.image_url)
    }
    
    // Add additional images from image_urls array
    if (product.image_urls && Array.isArray(product.image_urls)) {
      product.image_urls.forEach(img => {
        if (img && !images.includes(img)) {
          images.push(img)
        }
      })
    }
    
    // Add thumbnail if different
    if (product.thumbnail_url && !images.includes(product.thumbnail_url)) {
      images.push(product.thumbnail_url)
    }
    
    // Fallback to default image if no images found
    return images.length > 0 ? images : [pro1]
  }

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const isInStock = (): boolean => {
    if (!product) return false
    return (product.stock_quantity || 0) > 0 && product.status === 'active'
  }

  const renderStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return [...Array(5)].map((_, i) => {
      const starValue = i + 1
      const isFilled = starValue <= Math.floor(rating)
      const isHalfFilled = starValue - 0.5 <= rating && rating < starValue
      
      return (
        <button
          key={i}
          type="button"
          onClick={interactive && onRatingChange ? () => onRatingChange(starValue) : undefined}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
          disabled={!interactive}
        >
          <svg
            className={`w-5 h-5 ${
              isFilled
                ? 'text-yellow-400 fill-current'
                : isHalfFilled
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-gray-300'
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      )
    })
  }

  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to submit a review')
      navigate('/login')
      return
    }

    if (!product || !id) return

    if (reviewRating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!reviewComment.trim()) {
      toast.error('Please write a comment')
      return
    }

    try {
      setSubmittingReview(true)
      
      if (editingReview) {
        // Update existing review
        await updateProductReview(editingReview.id, {
          rating: reviewRating,
          title: reviewTitle || undefined,
          comment: reviewComment,
        })
        toast.success('Review updated successfully')
      } else {
        // Create new review
        await createProductReview({
          product_id: id,
          rating: reviewRating,
          title: reviewTitle || undefined,
          comment: reviewComment,
        })
        toast.success('Review submitted successfully')
      }

      // Reset form
      setReviewRating(0)
      setReviewTitle('')
      setReviewComment('')
      setShowReviewForm(false)
      setEditingReview(null)

      // Reload reviews
      const reviewsData = await getProductReviews(id)
      setReviews(reviewsData)
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review')
      console.error(error)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleEditReview = (review: ProductReview) => {
    if (!isLoggedIn) {
      toast.error('Please login to edit reviews')
      return
    }

    setEditingReview(review)
    setReviewRating(review.rating)
    setReviewTitle(review.title ?? '')
    setReviewComment(review.comment ?? '')
    setShowReviewForm(true)
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!isLoggedIn) {
      toast.error('Please login to delete reviews')
      return
    }

    if (!window.confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      await deleteProductReview(reviewId)
      toast.success('Review deleted successfully')
      
      // Reload reviews
      if (id) {
        const reviewsData = await getProductReviews(id)
        setReviews(reviewsData)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete review')
      console.error(error)
    }
  }

  const isUserReview = (review: ProductReview): boolean => {
    if (!isLoggedIn || !userSession) return false
    return review.user_id === userSession.user.id
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Product not found</p>
          <button
            onClick={() => navigate('/')}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const images = getProductImages()
  const currentImage = images[selectedImageIndex] || pro1
  const hasDiscount = product.original_price_cents && product.original_price_cents > product.price_cents
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price_cents! - product.price_cents) / product.original_price_cents!) * 100)
    : 0

  return (
    <div className="min-h-screen bg-white">
      <Banner />
      <NavBar />
      <div className="pt-[102px] md:pt-[118px]">
        <div className="max-w-[1440px] mx-auto px-[100px] py-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-600">
            <ol className="flex items-center space-x-2">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-gray-900 transition-colors">
                  Home
                </button>
              </li>
              <li>/</li>
              <li>
                <button className="hover:text-gray-900 transition-colors">Shop</button>
              </li>
              <li>/</li>
              <li>
                <button className="hover:text-gray-900 transition-colors">Men</button>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium">T-shirts</li>
            </ol>
          </nav>

          {/* Product Content */}
          <div className="grid grid-cols-2 gap-12 mb-16">
            {/* Left: Product Images */}
            <div className="flex gap-4">
              {/* Thumbnail Gallery */}
              <div className="flex flex-col gap-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-[152px] h-[167px] rounded-[20px] overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-black'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (target.src !== pro1) {
                          target.src = pro1
                        }
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Main Image */}
              <div className="flex-1 relative aspect-square bg-[#f0eeed] rounded-[20px] overflow-hidden">
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (target.src !== pro1) {
                      target.src = pro1
                    }
                  }}
                />
                {/* Discount Badge - Always visible if discount exists */}
                {hasDiscount && discountPercent > 0 && (
                  <div className="absolute top-4 left-4 bg-[rgba(255,51,51,0.1)] px-[14px] py-[6px] rounded-[62px] z-10">
                    <p className="text-[#f33] text-base font-medium">-{discountPercent}%</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* Product Name */}
              <h1 className="text-4xl font-bold text-black leading-none">
                {product.name.toUpperCase()}
              </h1>

              {/* Rating - Always show */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {renderStars(product.rating || 0)}
                </div>
                <span className="text-base text-black">
                  {(product.rating || 0).toFixed(1)}/<span className="text-black/60">5</span>
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-[32px] font-bold text-black">
                  {formatPrice(product.price_cents)}
                </span>
                {hasDiscount && product.original_price_cents && (
                  <>
                    <span className="text-[32px] text-black/30 line-through">
                      {formatPrice(product.original_price_cents)}
                    </span>
                    <span className="text-base font-semibold text-[#f33]">
                      Save {formatPrice(product.original_price_cents - product.price_cents)}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.short_description && (
                <p className="text-base text-black/60 leading-[22px] max-w-[590px]">
                  {product.short_description}
                </p>
              )}

              {/* Color Selection */}
              <div>
                <p className="text-base text-black/60 mb-4">Select Colors</p>
                <div className="flex gap-4">
                  {availableColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={`w-[37px] h-[37px] rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? 'border-black scale-110'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && (
                        <svg
                          className="w-5 h-5 text-white mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-black/10 w-full max-w-[590px]"></div>

              {/* Size Selection */}
              <div>
                <p className="text-base text-black/60 mb-4">Choose Size</p>
                <div className="flex gap-3">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 rounded-[62px] text-base font-medium transition-all ${
                        selectedSize === size
                          ? 'bg-black text-white'
                          : 'bg-[#f0f0f0] text-black/60 hover:bg-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-black/10 w-full max-w-[590px]"></div>

              {/* Quantity and Add to Cart */}
              <div className="flex gap-4 items-center">
                {/* Quantity Selector */}
                <div className="bg-[#f0f0f0] flex items-center justify-between px-5 py-4 rounded-[62px] w-[170px]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-black hover:opacity-70 transition-opacity"
                    disabled={quantity <= 1}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-base font-medium text-black">{quantity}</span>
                  <button
                    onClick={() => {
                      const maxQty = product.stock_quantity || 999
                      setQuantity(Math.min(maxQty, quantity + 1))
                    }}
                    className="text-black hover:opacity-70 transition-opacity"
                    disabled={quantity >= (product.stock_quantity || 999)}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock() || addingToCart}
                  className={`flex-1 bg-black text-white px-[54px] py-4 rounded-[62px] text-base font-medium transition-all ${
                    isInStock()
                      ? 'hover:bg-gray-800 active:bg-gray-900'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="border-t border-black/10 pt-8 mb-8">
            <div className="flex items-center justify-center gap-12 mb-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`text-xl transition-colors ${
                  activeTab === 'details' ? 'text-black font-medium' : 'text-black/60'
                }`}
              >
                Product Details
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`text-xl transition-colors relative ${
                  activeTab === 'reviews' ? 'text-black font-medium' : 'text-black/60'
                }`}
              >
                Rating & Reviews
                {activeTab === 'reviews' && (
                  <div className="absolute bottom-[-8px] left-0 right-0 h-0.5 bg-black"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('faqs')}
                className={`text-xl transition-colors ${
                  activeTab === 'faqs' ? 'text-black font-medium' : 'text-black/60'
                }`}
              >
                FAQs
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="max-w-[1240px]">
                {product.description ? (
                  <div
                    className="text-base text-black/60 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-base text-black/60">No description available.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {/* Reviews Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-black">All Reviews</h2>
                    <span className="text-base text-black/60">({reviews.length || product.review_count || 0})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="bg-[#f0f0f0] w-12 h-12 rounded-[62px] flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </button>
                    <button className="bg-[#f0f0f0] px-5 py-4 rounded-[62px] flex items-center gap-2 hover:bg-gray-200 transition-colors">
                      <span className="text-base font-medium text-black">Latest</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          toast.error('Please login to write a review')
                          navigate('/login')
                        } else {
                          setShowReviewForm(!showReviewForm)
                          setEditingReview(null)
                          if (!showReviewForm) {
                            setReviewRating(0)
                            setReviewTitle('')
                            setReviewComment('')
                          }
                        }
                      }}
                      className="bg-black text-white px-5 py-4 rounded-[62px] text-base font-medium hover:bg-gray-800 transition-colors"
                    >
                      {showReviewForm ? 'Cancel' : 'Write a Review'}
                    </button>
                  </div>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <div className="mb-8 border border-black/10 rounded-[20px] p-8 space-y-6">
                    <h3 className="text-2xl font-bold text-black">
                      {editingReview ? 'Edit Your Review' : 'Write a Review'}
                    </h3>
                    
                    {/* Interactive Star Rating */}
                    <div>
                      <label className="block text-base font-medium text-black mb-3">Rating *</label>
                      <div className="flex items-center gap-2">
                        {renderStars(reviewRating, true, setReviewRating)}
                        <span className="text-base text-black ml-2">
                          {reviewRating > 0 ? `${reviewRating}/5` : 'Select rating'}
                        </span>
                      </div>
                    </div>

                    {/* Review Title */}
                    <div>
                      <label className="block text-base font-medium text-black mb-3">Title (Optional)</label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Enter review title"
                        className="w-full px-4 py-3 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>

                    {/* Review Comment */}
                    <div>
                      <label className="block text-base font-medium text-black mb-3">Comment *</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Write your review here..."
                        rows={5}
                        className="w-full px-4 py-3 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleSubmitReview}
                        disabled={submittingReview || reviewRating === 0 || !reviewComment.trim()}
                        className="bg-black text-white px-8 py-3 rounded-[62px] text-base font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {submittingReview ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                      </button>
                      <button
                        onClick={() => {
                          setShowReviewForm(false)
                          setEditingReview(null)
                          setReviewRating(0)
                          setReviewTitle('')
                          setReviewComment('')
                        }}
                        className="border border-black/10 px-8 py-3 rounded-[62px] text-base font-medium text-black hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviews Grid */}
                {reviews.length > 0 ? (
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border border-black/10 rounded-[20px] p-8 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                          {isUserReview(review) && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditReview(review)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-black">
                            {review.user_id === userSession?.user.id ? loggedUser.name || 'You' : 'User'}
                          </h3>
                          {review.is_verified_purchase && (
                            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        {review.title && (
                          <h4 className="text-lg font-semibold text-black">{review.title}</h4>
                        )}
                        <p className="text-base text-black/60 leading-[22px]">
                          {review.comment || 'No comment provided.'}
                        </p>
                        <p className="text-base text-black/60 font-medium">
                          Posted on {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-base text-black/60">No reviews yet. Be the first to review this product!</p>
                  </div>
                )}

                {/* Load More Reviews */}
                {reviews.length > 6 && (
                  <div className="text-center">
                    <button className="border border-black/10 px-[54px] py-4 rounded-[62px] text-base font-medium text-black hover:bg-gray-50 transition-colors">
                      Load More Reviews
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'faqs' && (
              <div className="max-w-[1240px]">
                <p className="text-base text-black/60">FAQs content will be displayed here.</p>
              </div>
            )}
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-[48px] font-bold text-black text-center mb-12">
                You might also like
              </h2>
              <div className="grid grid-cols-4 gap-5">
                {relatedProducts.map((relatedProduct) => {
                  const hasRelatedDiscount = relatedProduct.original_price_cents && 
                    relatedProduct.original_price_cents > relatedProduct.price_cents
                  const relatedDiscountPercent = hasRelatedDiscount
                    ? Math.round(((relatedProduct.original_price_cents! - relatedProduct.price_cents) / relatedProduct.original_price_cents!) * 100)
                    : 0

                  return (
                    <Link
                      key={relatedProduct.id}
                      to={`/product/${relatedProduct.id}`}
                      className="group"
                    >
                      <div className="bg-[#f0eeed] rounded-[20px] overflow-hidden mb-4 aspect-[3/4] relative">
                        <img
                          src={relatedProduct.image_url || pro1}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            if (target.src !== pro1) {
                              target.src = pro1
                            }
                          }}
                        />
                        {hasRelatedDiscount && (
                          <div className="absolute top-2 left-2 bg-[rgba(255,51,51,0.1)] px-[14px] py-[6px] rounded-[62px]">
                            <p className="text-[#f33] text-xs font-medium">-{relatedDiscountPercent}%</p>
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-black mb-2">{relatedProduct.name}</h3>
                      {/* Rating - Always show */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {renderStars(relatedProduct.rating || 0)}
                        </div>
                        <span className="text-sm text-black">
                          {(relatedProduct.rating || 0).toFixed(1)}/<span className="text-black/60">5</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-black">
                          {formatPrice(relatedProduct.price_cents)}
                        </span>
                        {hasRelatedDiscount && (
                          <span className="text-2xl text-black/40 line-through">
                            {formatPrice(relatedProduct.original_price_cents!)}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Newsletter Signup */}
          <div className="mt-16 bg-black rounded-[20px] px-16 py-9 flex items-center justify-between">
            <h2 className="text-[40px] font-bold text-white leading-[45px] max-w-[551px]">
              STAY UPTO DATE ABOUT OUR LATEST OFFERS
            </h2>
            <div className="flex flex-col gap-[14px]">
              <div className="bg-white flex items-center gap-3 px-4 py-3 rounded-[62px] w-[349px]">
                <svg className="w-6 h-6 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="bg-transparent border-none outline-none text-base text-black/40 placeholder:text-black/40 flex-1"
                />
              </div>
              <button className="bg-white text-black px-4 py-3 rounded-[62px] text-base font-medium hover:bg-gray-100 transition-colors w-[349px]">
                Subscribe to Newsletter
              </button>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 border-t border-black/10 pt-12">
            <div className="flex justify-between mb-12">
              {/* Brand Section */}
              <div className="flex flex-col gap-9">
                <div className="flex flex-col gap-6">
                  <h3 className="text-[33px] font-bold text-black leading-none">SHOP.CO</h3>
                  <p className="text-sm text-black/60 leading-[22px] max-w-[248px]">
                    We have clothes that suits your style and which you're proud to wear. From women to men.
                  </p>
                </div>
                {/* Social Icons */}
                <div className="flex gap-10">
                  <a href="#" className="w-7 h-7 hover:opacity-70 transition-opacity">
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-7 h-7 hover:opacity-70 transition-opacity">
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-7 h-7 hover:opacity-70 transition-opacity">
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-7 h-7 hover:opacity-70 transition-opacity">
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Company Links */}
              <div className="flex flex-col gap-6">
                <h4 className="text-base font-medium text-black tracking-[3px] uppercase">Company</h4>
                <div className="flex flex-col gap-4 text-base text-black/60">
                  <a href="#" className="hover:text-black transition-colors">About</a>
                  <a href="#" className="hover:text-black transition-colors">Features</a>
                  <a href="#" className="hover:text-black transition-colors">Works</a>
                  <a href="#" className="hover:text-black transition-colors">Career</a>
                </div>
              </div>

              {/* Help Links */}
              <div className="flex flex-col gap-6">
                <h4 className="text-base font-medium text-black tracking-[3px] uppercase">Help</h4>
                <div className="flex flex-col gap-4 text-base text-black/60">
                  <a href="#" className="hover:text-black transition-colors">Customer Support</a>
                  <a href="#" className="hover:text-black transition-colors">Delivery Details</a>
                  <a href="#" className="hover:text-black transition-colors">Terms & Conditions</a>
                  <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
                </div>
              </div>

              {/* FAQ Links */}
              <div className="flex flex-col gap-6">
                <h4 className="text-base font-medium text-black tracking-[3px] uppercase">FAQ</h4>
                <div className="flex flex-col gap-4 text-base text-black/60">
                  <a href="#" className="hover:text-black transition-colors">Account</a>
                  <a href="#" className="hover:text-black transition-colors">Manage Deliveries</a>
                  <a href="#" className="hover:text-black transition-colors">Orders</a>
                  <a href="#" className="hover:text-black transition-colors">Payments</a>
                </div>
              </div>

              {/* Resources Links */}
              <div className="flex flex-col gap-6">
                <h4 className="text-base font-medium text-black tracking-[3px] uppercase">Resources</h4>
                <div className="flex flex-col gap-4 text-base text-black/60">
                  <a href="#" className="hover:text-black transition-colors">Free eBooks</a>
                  <a href="#" className="hover:text-black transition-colors">Development Tutorial</a>
                  <a href="#" className="hover:text-black transition-colors">How to - Blog</a>
                  <a href="#" className="hover:text-black transition-colors">Youtube Playlist</a>
                </div>
              </div>
            </div>

            {/* Footer Bottom */}
            <div className="border-t border-black/10 pt-8 flex items-center justify-between">
              <p className="text-sm text-black/60">Shop.co © 2000-2023, All Rights Reserved</p>
              {/* Payment Icons */}
              <div className="flex gap-3">
                <div className="w-[46px] h-[30px] bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">VISA</span>
                </div>
                <div className="w-[46px] h-[30px] bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">MC</span>
                </div>
                <div className="w-[46px] h-[30px] bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">PP</span>
                </div>
                <div className="w-[46px] h-[30px] bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">GP</span>
                </div>
                <div className="w-[46px] h-[30px] bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">AP</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
