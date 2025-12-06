import { Link } from "react-router-dom"

const Login = () => {
  return (
    <div className="min-h-screen bg-[#f2f0f1] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#e5e5e5] p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold tracking-tight text-black">SHOP.CO</div>
          <p className="text-gray-600 mt-2 text-sm">Welcome back. Please sign in.</p>
        </div>

        <form className="space-y-4">
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

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" className="rounded border-gray-300 text-black focus:ring-black" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-gray-900 hover:opacity-80 font-medium">
              Forgot password?
            </Link>
          </div>

          <button
            type="button"
            className="w-full bg-black text-white rounded-lg py-3 font-semibold hover:opacity-90 transition"
          >
            Sign In
          </button>
        </form>

       

       

        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-black hover:text-gray-800 transition">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}

export default Login


