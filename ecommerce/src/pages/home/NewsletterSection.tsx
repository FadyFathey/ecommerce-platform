import { FormEvent, useState } from 'react'

const NewsletterSection = () => {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Hook up to Supabase/email provider later
    console.log('Subscribe email:', email)
  }

  return (
    <section className="mt-14">
      <div className="bg-black text-white rounded-[28px] sm:rounded-[36px] px-6 py-10 sm:px-10 sm:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.1] uppercase tracking-tight">
              Stay up to date about
              <br />
              our latest offers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-3">
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 6l8 6 8-6M4 6v12h16V6" />
                </svg>
              </span>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-full bg-white text-gray-800 pl-11 pr-4 py-3.5 text-sm sm:text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/70"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-white text-black font-semibold py-3.5 text-sm sm:text-base hover:bg-gray-100 transition-colors"
            >
              Subscribe to Newsletter
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default NewsletterSection

