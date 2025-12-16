import { useEffect, useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { NavBar } from '../components/NavBar'
import Banner from '../components/banner'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { createPaymentIntentFromCart } from '../services/orderService'
import { clearCart } from '../store/slices/cartSlice'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

const CheckoutForm = ({ orderId, clientSecret }: { orderId: string; clientSecret: string }) => {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?orderId=${orderId}`,
      },
      redirect: 'if_required',
    })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Payment failed')
      return
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast.success('Payment succeeded')
      dispatch(clearCart())
      // Redirect to order confirmation page (accessible to all users)
      navigate(`/orders/${orderId}`)
    } else {
      toast.success('Payment processing')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-black text-white py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay now'}
      </button>
    </form>
  )
}

const CheckoutPage = () => {
  const { items } = useAppSelector((state) => state.cart)
  const userSession = useAppSelector((state) => state.auth.session)
  const navigate = useNavigate()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('CheckoutPage: effect triggered', {
      hasUserSession: !!userSession,
      itemsCount: items.length,
    })

    if (!userSession) {
      toast.error('Please login to checkout')
      navigate('/login')
      return
    }
    if (items.length === 0) {
      toast.error('Your cart is empty')
      navigate('/cart')
      return
    }
    const fetchIntent = async () => {
      try {
        setLoading(true)
        console.log('CheckoutPage: calling createPaymentIntentFromCart')
        const res = await createPaymentIntentFromCart(items)
        console.log('CheckoutPage: payment intent created', res)
        setClientSecret(res.clientSecret)
        setOrderId(res.orderId)
      } catch (error) {
        console.error('CheckoutPage: failed to start checkout', error)
        toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
        navigate('/cart')
      } finally {
        setLoading(false)
      }
    }
    fetchIntent()
  }, [items, navigate, userSession])

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret: clientSecret || undefined,
      appearance: { theme: 'stripe' },
    }),
    [clientSecret]
  )

  return (
    <div className="min-h-screen bg-white">
      <Banner />
      <NavBar />
      <div className="pt-[102px] md:pt-[118px]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-black mb-6">Checkout</h1>
          {loading && <p className="text-gray-600">Preparing payment...</p>}
          {!loading && clientSecret && orderId && stripePromise && (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm orderId={orderId} clientSecret={clientSecret} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage

