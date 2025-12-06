import { Link } from "react-router-dom"

const Signup = () => {
  return (
    <div className="min-h-screen bg-[#f2f0f1] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#e5e5e5] p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold tracking-tight text-black">SHOP.CO</div>
          <p className="text-gray-600 mt-2 text-sm">Create your account to start shopping.</p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Full name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
            />
          </div>

          <button
            type="button"
            className="w-full bg-black text-white rounded-lg py-3 font-semibold hover:opacity-90 transition"
          >
            Create Account
          </button>
        </form>

        

       

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-black hover:text-gray-800 transition">Log In</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup


