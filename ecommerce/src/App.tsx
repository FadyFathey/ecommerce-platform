import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast';
import { Provider, useDispatch } from 'react-redux'
import { store } from './store'
import './App.css'
import AppRoutes from './routes/AppRoutes'
import { checkUserLogin } from './store/slices/authSlice'
import { supabase } from './lib/supabase'

// Component to initialize session check
function AppInitializer() {
  const dispatch = useDispatch()
  
  useEffect(() => {
    // Check for existing session on app load
    const initializeSession = async () => {
      // Give Supabase a moment to initialize and read from storage
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Check session
      const result = await dispatch(checkUserLogin())
      
      // If no session was found, try one more time after a short delay
      // This handles cases where Supabase is still initializing
      if (!result.payload) {
        await new Promise(resolve => setTimeout(resolve, 300))
        dispatch(checkUserLogin())
      }
    }
    
    initializeSession()
    
    // Listen to auth state changes from Supabase
    // This will fire when Supabase detects a session in storage
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session')
      // Update Redux state when auth state changes
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || (event === 'INITIAL_SESSION' && session)) {
        dispatch(checkUserLogin())
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch])
  
  return null
}

function App() {
  return (
    <Provider store={store}>
      <AppInitializer />
      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{ margin: '8px' }}
        toastOptions={{
          success: {
            duration: 3000,
          },
          error: {
            duration: 5000,
          },
          style: {
            fontSize: '16px',
            maxWidth: '500px',
            padding: '16px 24px',
            backgroundColor: 'white',
            color: 'var(--color-grey-700)',
          },
        }}
      />
      <AppRoutes />
    </Provider>
  )
}

export default App