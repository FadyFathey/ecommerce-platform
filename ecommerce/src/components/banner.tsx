import { useState } from 'react'

const Banner = () => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-black fixed top-0 left-0 right-0 w-full h-[38px] flex items-center justify-center px-4 md:px-6 lg:px-8 z-50">
      {/* Main text content */}
      <p className="text-white text-xs sm:text-sm md:text-base text-center px-8 sm:px-12 md:px-16">
        <span className="font-normal">
          Sign up and get 20% off to your first order.
        </span>
        <a
          href="#"
          className="underline decoration-solid underline-offset-2 hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.preventDefault()
          }}
        >
          Sign Up Now
        </a>
      </p>

      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 text-white hover:opacity-70 transition-opacity p-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
        aria-label="Close banner"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 sm:w-5 sm:h-5"
        >
          <path
            d="M15 5L5 15M5 5L15 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}

export default Banner