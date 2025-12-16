import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../components/banner'
import { NavBar } from '../components/NavBar'
import SectionHeading from '../components/SectionHeading'
import { supabase } from '../lib/supabase'

interface Category {
  id: string
  name: string
  slug: string
  image_url?: string | null
}

// Reusable section that can be shown on the home page or its own page
export const CategoriesSection = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, image_url')
          .order('name')

        if (error) throw error

        setCategories(data || [])
      } catch (err) {
        console.error('Failed to load categories', err)
        setError('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  return (
    <section className="bg-[#f0f0f0] rounded-[28px] sm:rounded-[40px] px-4 py-8 sm:p-10 md:p-14 shadow-sm mt-12">
      <SectionHeading
        title="BROWSE BY CATEGORY"
        className="mt-0 mb-8 sm:mb-10 uppercase tracking-tight text-black"
      />

      {loading ? (
        <p className="text-gray-600 text-sm">Loading categories...</p>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-600 text-sm">No categories found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          {categories.map((category, index) => {
            // Mimic the Figma mosaic shape by varying column spans
            const layoutClasses = ['md:col-span-4', 'md:col-span-8', 'md:col-span-8', 'md:col-span-4']
            const gridClass = layoutClasses[index] || 'md:col-span-4'

            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className={`relative overflow-hidden rounded-[18px] sm:rounded-[20px] bg-white shadow-md min-h-[220px] sm:min-h-[260px] flex flex-col justify-end hover:shadow-lg transition-shadow ${gridClass}`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: category.image_url
                      ? `url(${category.image_url})`
                      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

                <div className="relative h-full flex flex-col justify-end px-5 py-6 sm:px-7 sm:py-8">
                  <p className="text-2xl sm:text-[32px] font-semibold text-white drop-shadow-md">
                    {category.name}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

// Full categories page (kept as a separate route)
const Categories = () => {
  return (
    <div className="min-h-screen bg-white">
      <Banner />
      <NavBar />

      <main className="pt-[120px] md:pt-[140px] pb-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <CategoriesSection />
        </div>
      </main>
    </div>
  )
}

export default Categories
