import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Banner from '../components/banner'
import { NavBar } from '../components/NavBar'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearCart, removeItem, updateQuantity } from '../store/slices/cartSlice'
import pro1 from '../assets/prodcuts/prod1.png'
import { createPaymentIntentFromCart } from '../services/orderService'
import { useState } from 'react'

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

const CartPage = () => {
  const { items, subtotalCents, totalQuantity } = useAppSelector((state) => state.cart)
  const userSession = useAppSelector((state) => state.auth.session)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const getMaxQty = (stock?: number | null) => (typeof stock === 'number' && stock > 0 ? stock : 999)

  const shippingCents = subtotalCents > 0 ? 0 : 0
  const totalCents = subtotalCents + shippingCents

  const handleQuantityChange = (cartKey: string, quantity: number, stock?: number | null) => {
    const maxQty = getMaxQty(stock)
    const nextQty = Math.max(1, Math.min(quantity || 1, maxQty))
    dispatch(updateQuantity({ cartKey, quantity: nextQty }))
  }

  const handleClearCart = () => {
    dispatch(clearCart())
    toast.success('Cart cleared')
  }

  const handleCheckout = async () => {
    if (!userSession) {
      toast.error('Please login to checkout')
      navigate('/login')
      return
    }

    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setIsCheckingOut(true)
    try {
      // Create PaymentIntent + order, then move to checkout page for confirmation
      await createPaymentIntentFromCart(items)
      navigate('/checkout')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed')
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Banner />
      <NavBar />

      <div className="pt-[102px] md:pt-[118px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-black">Shopping Cart</h1>
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-sm text-red-600 hover:text-red-700 font-semibold"
              >
                Clear Cart
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-black mb-3">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Start adding items to see them here.</p>
              <Link
                to="/"
                className="inline-flex items-center justify-center bg-black text-white px-6 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.cartKey}
                    className="flex gap-4 border border-black/10 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="w-28 h-28 rounded-xl overflow-hidden bg-[#f0f0f0] shrink-0">
                      <img
                        src={item.image_url || pro1}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          if (target.src !== pro1) {
                            target.src = pro1
                          }
                        }}
                      />
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-black">{item.name}</h3>
                          <p className="text-sm text-gray-600">
                            Price: {formatPrice(item.price_cents)}
                          </p>
                          <div className="text-xs text-gray-500 mt-1 space-x-3">
                            {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                            {item.selectedColor && (
                              <span className="inline-flex items-center gap-1">
                                Color:
                                <span
                                  className="inline-block w-4 h-4 rounded-full border border-gray-200"
                                  style={{ backgroundColor: item.selectedColor }}
                                />
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => dispatch(removeItem({ cartKey: item.cartKey }))}
                          className="text-sm text-gray-500 hover:text-red-600 font-medium"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#f0f0f0] flex items-center justify-between px-4 py-2 rounded-full w-[140px]">
                            <button
                              onClick={() =>
                                handleQuantityChange(item.cartKey, item.quantity - 1, item.stock_quantity)
                              }
                              className="text-black hover:opacity-70 transition-opacity"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="text-base font-medium text-black">{item.quantity}</span>
                            <button
                              onClick={() =>
                                handleQuantityChange(item.cartKey, item.quantity + 1, item.stock_quantity)
                              }
                              className="text-black hover:opacity-70 transition-opacity"
                              disabled={
                                typeof item.stock_quantity === 'number' &&
                                item.stock_quantity > 0 &&
                                item.quantity >= item.stock_quantity
                              }
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-500">Subtotal</p>
                          <p className="text-lg font-semibold text-black">
                            {formatPrice(item.price_cents * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border border-black/10 rounded-2xl p-6 h-fit sticky top-28 shadow-sm">
                <h2 className="text-xl font-bold text-black mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span>Items</span>
                    <span className="font-semibold">{totalQuantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatPrice(subtotalCents)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold">
                      {shippingCents === 0 ? 'Free' : formatPrice(shippingCents)}
                    </span>
                  </div>
                  <div className="border-t border-black/10 pt-3 flex items-center justify-between text-base font-bold text-black">
                    <span>Total</span>
                    <span>{formatPrice(totalCents)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-black text-white py-3 rounded-full text-base font-medium mt-6 hover:bg-gray-800 transition-colors"
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                </button>
                <Link
                  to="/"
                  className="block text-center mt-3 text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartPage

