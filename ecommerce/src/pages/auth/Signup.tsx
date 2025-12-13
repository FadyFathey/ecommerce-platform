import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { createUser } from "../../store/slices/authSlice";
import type { RootState } from "../../store";
import toast from "react-hot-toast";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state: RootState) => state.auth);
  
  const createUserFn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    // Basic validation
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    try {
      const resultAction = await dispatch(createUser({ 
        email, 
        password, 
        name,
        phone: phone || undefined // Only include if not empty
      }));
      
      if (createUser.fulfilled.match(resultAction)) {
        // Show success toast and redirect
        toast.success('Account created successfully! You can now log in.');
        setTimeout(() => {
          navigate('/login'); // Redirect to login page after successful signup
        }, 1500);
      }
    } catch (err: any) {
      // Show error toast if there's an error
      toast.error(err?.message || 'An error occurred during signup');
      console.error('Signup failed:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#e5e5e5] p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold tracking-tight text-black">SHOP.CO</div>
          <p className="text-gray-600 mt-2 text-sm">Create your account to start shopping.</p>
        </div>

        <form onSubmit={createUserFn} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {formError}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {typeof error === 'string' ? error : 'An error occurred during signup'}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-gray-800">Full name</label>
            <input
              id="fullName"
              type="text"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-800">Email</label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-800">Phone Number (Optional)</label>
            <input
              id="phone"
              type="tel"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-800">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-800">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-black text-white rounded-lg font-medium ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>


        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?
          <Link to="/login" className="text-black hover:text-gray-800 transition">Log In</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup


