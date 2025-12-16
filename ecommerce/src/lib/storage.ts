// Custom storage adapter for Supabase that respects "Remember me" preference

const REMEMBER_ME_KEY = 'supabase.rememberMe'

// Find Supabase auth token key by searching for keys that match Supabase pattern
const findSupabaseAuthKey = (): string | null => {
  // Check localStorage first
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('sb-') && key.includes('auth-token')) {
      return key
    }
  }
  // Check sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.startsWith('sb-') && key.includes('auth-token')) {
      return key
    }
  }
  return null
}

export const setRememberMe = (value: boolean) => {
  localStorage.setItem(REMEMBER_ME_KEY, value ? 'true' : 'false')
  
  // Find and migrate Supabase auth token
  const authKey = findSupabaseAuthKey()
  if (authKey) {
    if (value) {
      // Move from sessionStorage to localStorage
      const sessionData = sessionStorage.getItem(authKey)
      if (sessionData) {
        localStorage.setItem(authKey, sessionData)
        sessionStorage.removeItem(authKey)
      }
    } else {
      // Move from localStorage to sessionStorage
      const sessionData = localStorage.getItem(authKey)
      if (sessionData) {
        sessionStorage.setItem(authKey, sessionData)
        localStorage.removeItem(authKey)
      }
    }
  }
}

export const getRememberMe = (): boolean => {
  const stored = localStorage.getItem(REMEMBER_ME_KEY)
  // Default to true if not set (backward compatibility)
  return stored !== 'false'
}

// Custom storage adapter that uses localStorage when rememberMe is true,
// and sessionStorage when rememberMe is false
export const createRememberMeStorage = () => {
  return {
    getItem: (key: string): string | null => {
      try {
        const rememberMe = getRememberMe()
        // Try both storages and return the first match
        // This handles the case where the preference changed but token is still in the old location
        const localValue = localStorage.getItem(key)
        const sessionValue = sessionStorage.getItem(key)
        
        if (rememberMe) {
          // Prefer localStorage, but fallback to sessionStorage if not found
          const value = localValue || sessionValue
          // If found in sessionStorage but rememberMe is true, migrate it
          if (!localValue && sessionValue) {
            localStorage.setItem(key, sessionValue)
            sessionStorage.removeItem(key)
          }
          return value
        } else {
          // Prefer sessionStorage, but fallback to localStorage if not found
          const value = sessionValue || localValue
          // If found in localStorage but rememberMe is false, migrate it
          if (!sessionValue && localValue) {
            sessionStorage.setItem(key, localValue)
            localStorage.removeItem(key)
          }
          return value
        }
      } catch (error) {
        console.error('Storage getItem error:', error)
        // Fallback to localStorage if there's an error
        return localStorage.getItem(key) || sessionStorage.getItem(key)
      }
    },
    setItem: (key: string, value: string): void => {
      const rememberMe = getRememberMe()
      if (rememberMe) {
        localStorage.setItem(key, value)
        // Remove from sessionStorage if it exists there
        sessionStorage.removeItem(key)
      } else {
        sessionStorage.setItem(key, value)
        // Remove from localStorage if it exists there
        localStorage.removeItem(key)
      }
    },
    removeItem: (key: string): void => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    },
  }
}

