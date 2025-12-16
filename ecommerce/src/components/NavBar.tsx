import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { checkUserLogin, userLogOut } from '../store/slices/authSlice'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { supabase } from '../lib/supabase'

export const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const userSession = useSelector((state: RootState) => state.auth.session)
  const cartCount = useAppSelector((state) => state.cart.totalQuantity)
  const navigate = useNavigate()

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen])

  useEffect(() => {
    dispatch(checkUserLogin())
  }, [])

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!userSession) {
        setIsAdmin(false)
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Standardize on raw_user_meta_data to match SQL function
          const userRole = user.raw_user_meta_data?.role || user.user_metadata?.role
          setIsAdmin(userRole === 'admin')
        }
      } catch (error) {
        setIsAdmin(false)
      }
    }

    checkAdminRole()
  }, [userSession])

  // useEffect(() => {
  //   console.log("User Session:", userSession ? userSession.access_token : "")
  // }, [userSession])

  // userLogOut FUN
  const userLogOutFn = async () => {
    setIsProfileOpen(false)

    try {
      await dispatch(userLogOut()).unwrap()
      toast.success("Logged out successfully")
      navigate("/")
    } catch (error) {
      const errorMessage = (error as any)?.message || "Failed to log out."
      toast.error(errorMessage)
    }
  }

  return (
    <nav className="bg-white w-full border-b border-gray-200 fixed top-[38px] left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="shrink-0">
            <Link to="/" className="text-black text-2xl md:text-3xl font-bold leading-none hover:opacity-80 transition">
              SHOP.CO
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 flex-1 justify-center">
            <a href="#" className="text-gray-700 hover:text-black transition-colors">Shop</a>
            <a href="#" className="text-gray-700 hover:text-black transition-colors">On Sale</a>
            <a href="#" className="text-gray-700 hover:text-black transition-colors">New Arrivals</a>
            <a href="#" className="text-gray-700 hover:text-black transition-colors">Brands</a>
          </div>

          {/* Search Input */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="bg-[#f0f0f0] w-full flex items-center gap-3 px-4 py-3 rounded-[62px]">
              <svg className="w-6 h-6 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search for products..."
                className="bg-transparent border-none outline-none text-base text-black/40 placeholder:text-black/40 w-full"
              />
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link to="/cart" className="p-2 text-black hover:opacity-70 transition-opacity relative cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <span className="absolute top-1 right-1 bg-black text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                {Math.min(cartCount, 99)}
              </span>
            </Link>

            {/* Profile / Login & Sign Up */}
            <div className="relative" ref={profileRef}>
              {userSession ? (
                <>
                  {/* Profile icon */}
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="p-2 text-black hover:opacity-70 transition-opacity cursor-pointer"
                    aria-label="Profile menu"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Settings
                      </Link>

                      {/* Admin Dashboard Link - Only show for admins */}
                      {isAdmin && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="block px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Admin Dashboard
                            </div>
                          </Link>
                        </>
                      )}

                      <div className="border-t border-gray-200 my-1"></div>

                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                        onClick={userLogOutFn}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* If NOT logged in */
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-md bg-black text-white text-sm hover:opacity-80 transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 rounded-md border border-black text-sm hover:bg-black hover:text-white transition"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Menu toggle for mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-black transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <a href="#" className="text-gray-700 hover:text-black transition-colors">Shop</a>
              <a href="#" className="text-gray-700 hover:text-black transition-colors">On Sale</a>
              <a href="#" className="text-gray-700 hover:text-black transition-colors">New Arrivals</a>
              <a href="#" className="text-gray-700 hover:text-black transition-colors">Brands</a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
