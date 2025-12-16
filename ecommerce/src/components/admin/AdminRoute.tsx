import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface AdminRouteProps {
  children: ReactNode
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { session: userSession, loading: authLoading, initialized } = useSelector((state: RootState) => state.auth)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null) // null = checking, true = admin, false = not admin
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdminRole = async () => {
      // Wait for auth to finish the first session check to avoid false redirects on refresh
      if (authLoading || !initialized) {
        setIsLoading(true)
        return
      }

      if (!userSession) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      try {
        // Get user metadata from Supabase
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          setIsAdmin(false)
          setIsLoading(false)
          return
        }

        // Check if user has admin role in metadata (standardize on raw_user_meta_data to match SQL function)
        const userRole = user.raw_user_meta_data?.role || user.user_metadata?.role
        
        if (userRole === 'admin') {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
          toast.error('Access denied. Admin role required.')
        }
      } catch (error) {
        console.error('Error checking admin role:', error)
        setIsAdmin(false)
        toast.error('Failed to verify admin access')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminRole()
  }, [userSession, authLoading, initialized])

  // Show loading state
  if (isLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!userSession) {
    return <Navigate to="/login" replace />
  }

  // Redirect to home if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  // Render admin content if user is admin
  return <>{children}</>
}

export default AdminRoute




