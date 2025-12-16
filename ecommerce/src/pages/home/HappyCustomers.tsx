import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Testimonial = {
  id: string
  name: string
  role: string
  avatar: string
  message: string
  rating: number
  date: string
}

type ReviewRow = {
  id: string
  product_id: string
  rating: number
  title: string | null
  comment: string | null
  created_at: string
}

type ProductRow = {
  id: string
  name: string
}

type ProfileRow = {
  id: string
  full_name?: string | null
  name?: string | null
  avatar_url?: string | null
}

// Simple avatar placeholders; could be swapped for real user photos later
const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=160&q=80',
]

const ArrowIcon = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    {direction === 'left' ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    )}
  </svg>
)

const Stars = ({ count }: { count: number }) => (
  <div className="flex items-center gap-1">
    {[...Array(5)].map((_, idx) => (
      <span
        key={idx}
        className={`h-4 w-4 ${idx < count ? 'text-yellow-500' : 'text-gray-300'}`}
      >
        ★
      </span>
    ))}
  </div>
)

export const HappyCustomers = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [startIndex, setStartIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the most recent reviews
        const { data: reviews, error: reviewsError } = await supabase
          .from('product_reviews')
          .select('id, product_id, rating, title, comment, created_at')
          .order('created_at', { ascending: false })
          .limit(12)

        if (reviewsError) throw reviewsError

        const reviewRows: ReviewRow[] = reviews || []
        const productIds = Array.from(new Set(reviewRows.map((r) => r.product_id).filter(Boolean)))
        const userIds = Array.from(new Set(reviewRows.map((r) => (r as any).user_id).filter(Boolean)))

        // Fetch product names for context
        let productMap: Record<string, ProductRow> = {}
        if (productIds.length) {
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name')
            .in('id', productIds)

          if (productsError) throw productsError
          productMap = (products || []).reduce<Record<string, ProductRow>>((acc, product) => {
            acc[product.id] = product
            return acc
          }, {})
        }

        // Fetch basic user profile info (best effort)
        let profileMap: Record<string, ProfileRow> = {}
        if (userIds.length) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, name, avatar_url')
            .in('id', userIds)

          if (profilesError) {
            console.warn('Profiles not available, falling back to placeholders')
          } else {
            profileMap = (profiles || []).reduce<Record<string, ProfileRow>>((acc, profile) => {
              acc[profile.id] = profile
              return acc
            }, {})
          }
        }

        const hydrated = reviewRows.map((review, idx) => {
          const productName = productMap[review.product_id]?.name
          const rating = Math.min(5, Math.max(1, review.rating || 4))
          const userId = (review as any).user_id as string | undefined
          const profile = userId ? profileMap[userId] : undefined

          const displayName =
            profile?.full_name ||
            profile?.name ||
            (review.title ? `${review.title}` : 'Happy customer')
          const displayAvatar = profile?.avatar_url || AVATARS[idx % AVATARS.length]

          return {
            id: review.id,
            name: displayName,
            role: productName ? `Purchased ${productName}` : 'Verified customer',
            avatar: displayAvatar,
            message: review.comment || 'No comment provided.',
            rating,
            date: new Date(review.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            }),
          } satisfies Testimonial
        })

        setTestimonials(hydrated)
      } catch (err: any) {
        console.error('Failed to load testimonials', err)
        setError(err?.message || 'Failed to load testimonials')
      } finally {
        setLoading(false)
      }
    }

    loadTestimonials()
  }, [])

  const visible = useMemo(() => {
    if (!testimonials.length) return []
    const take = Math.min(3, testimonials.length)
    return Array.from({ length: take }, (_, idx) => testimonials[(startIndex + idx) % testimonials.length])
  }, [startIndex, testimonials])

  const handlePrev = () => {
    if (!testimonials.length) return
    setStartIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const handleNext = () => {
    if (!testimonials.length) return
    setStartIndex((prev) => (prev + 1) % testimonials.length)
  }

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Our Happy Customers</p>
          <h3 className="text-2xl sm:text-3xl md:text-[40px] font-bold text-gray-900 leading-tight">
            Real stories. Real smiles.
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            aria-label="Previous testimonials"
            onClick={handlePrev}
            disabled={loading || testimonials.length <= 1}
            className="h-10 w-10 rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            aria-label="Next testimonials"
            onClick={handleNext}
            disabled={loading || testimonials.length <= 1}
            className="h-10 w-10 rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Loading testimonials...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : testimonials.length === 0 ? (
        <p className="text-sm text-gray-600">No testimonials yet.</p>
      ) : (
        <div
          className={`grid gap-4 sm:gap-6 ${
            testimonials.length >= 3 ? 'md:grid-cols-3' : testimonials.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'
          }`}
        >
          {visible.map((item, idx) => (
            <article
              key={`${item.id}-${idx}`}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-base font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.role}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{item.date}</span>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mb-5 line-clamp-4">{item.message}</p>

              <div className="flex items-center justify-between">
                <Stars count={item.rating} />
                <span className="text-xs font-medium text-gray-600">
                  {item.rating.toFixed(1)} / 5.0
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default HappyCustomers

