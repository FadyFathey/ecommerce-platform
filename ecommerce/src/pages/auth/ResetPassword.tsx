import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { resetPassword } from "../../store/slices/authSlice"
import { supabase } from "../../lib/supabase"
import type { RootState } from "../../store"
import toast from "react-hot-toast"

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState("")
  const [isValidSession, setIsValidSession] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((state: RootState) => state.auth)

  // Check if user has a valid recovery session on mount
  useEffect(() => {
    const checkRecoverySession = async () => {
      // Check URL hash for recovery token first
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      if (accessToken && type === 'recovery') {
        // Supabase automatically exchanges the token for a session
        // Wait a bit for Supabase to process the hash
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session && !error) {
          setIsValidSession(true)
        } else {
          toast.error("Invalid or expired reset link. Please request a new one.")
          setTimeout(() => {
            navigate("/forgot-password")
          }, 2000)
        }
      } else {
        // Check if there's already a valid session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setIsValidSession(true)
        } else {
          toast.error("Invalid or expired reset link. Please request a new one.")
          setTimeout(() => {
            navigate("/forgot-password")
          }, 2000)
        }
      }
    }

    checkRecoverySession()
  }, [navigate])

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError("")

    // Validation
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match")
      toast.error("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters long")
      toast.error("Password must be at least 6 characters long")
      return
    }

    if (!isValidSession) {
      setFormError("Invalid or expired reset link")
      toast.error("Invalid or expired reset link. Please request a new one.")
      return
    }

    const resultAction = await dispatch(resetPassword(newPassword))
    
    if (resetPassword.fulfilled.match(resultAction)) {
      toast.success("Password updated successfully! You can now log in.")
      setTimeout(() => {
        navigate("/login")
      }, 1500)
    } else {
      const errorMessage = (resultAction.payload as string) || "Failed to update password"
      toast.error(errorMessage)
    }
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-[#f2f0f1] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-md bg-white rounded-xl sm:rounded-2xl shadow-sm border border-[#e5e5e5] p-6 sm:p-8 text-center">
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f0f1] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="w-full max-w-md bg-white rounded-xl sm:rounded-2xl shadow-sm border border-[#e5e5e5] p-6 sm:p-8">
        <div className="mb-6 sm:mb-8 text-center">
          <Link to="/" className="inline-block">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-black hover:opacity-80 transition cursor-pointer">SHOP.CO</div>
          </Link>
          <p className="text-gray-600 mt-2 text-xs sm:text-sm">Set your new password</p>
        </div>

        <form className="space-y-4 sm:space-y-5" onSubmit={handleResetPassword}>
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {formError}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-gray-800">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-gray-800">Confirm New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <p className="text-xs sm:text-sm text-gray-600">
            Enter your new password below. Make sure it&apos;s at least 6 characters long.
          </p>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-black text-white rounded-lg py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
            }`}
          >
            {loading ? "Updating Password..." : "Reset Password"}
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

export default ResetPassword

