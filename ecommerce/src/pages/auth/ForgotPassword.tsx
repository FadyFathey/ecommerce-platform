import { Link } from "react-router-dom"
import { forgotPassword } from "../../store/slices/authSlice"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { useState } from "react"
import toast from "react-hot-toast"
import type { RootState } from "../../store"

export const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state: RootState) => state.auth)

  const forgotPasswordFn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("email", email);
    
    const resultAction = await dispatch(forgotPassword(email))
    if (forgotPassword.fulfilled.match(resultAction)) {
      toast.success("Password reset email sent! Please check your inbox and click the link to reset your password.")
    } else {
      toast.error("Failed to send password reset email")
    }
  }
  return (
    <div className="min-h-screen bg-[#f2f0f1] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="w-full max-w-md bg-white rounded-xl sm:rounded-2xl shadow-sm border border-[#e5e5e5] p-6 sm:p-8">
        <div className="mb-6 sm:mb-8 text-center">
          <Link to="/" className="inline-block">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-black hover:opacity-80 transition cursor-pointer">SHOP.CO</div>
          </Link>
          <p className="text-gray-600 mt-2 text-xs sm:text-sm">Reset your password</p>
        </div>

        <form className="space-y-4 sm:space-y-5" onSubmit={forgotPasswordFn}>
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error || "Failed to send password reset email"}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-gray-800">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <p className="text-xs sm:text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <button
              type="submit"
            className="w-full bg-black text-white rounded-lg py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:opacity-90 transition cursor-pointer"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <Link 
            to="/login" 
            className="block text-center text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition"
          >
            ← Back to Sign In
          </Link>
          <p className="text-center text-xs sm:text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-black hover:text-gray-800 transition font-medium">Sign Up</Link>
          </p>
          <Link 
            to="/" 
            className="block text-center text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

