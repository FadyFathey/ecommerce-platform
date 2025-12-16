import { supabase } from '../lib/supabase'

export interface User {
  id: string
  email: string
  name: string | null
  role: string | null
  created_at: string
  last_sign_in_at: string | null
}

export interface UserDetails extends User {
  phone?: string | null
}

// Get all users from Supabase
export const getAllUsers = async (): Promise<User[]> => {
  // Use database function to get all users
  const { data, error } = await supabase.rpc('get_all_users')
  
  if (error) {
    // If function doesn't exist, provide helpful error
    if (error.message.includes('function') || error.message.includes('does not exist')) {
      throw new Error(
        'Database function not found. Please run the migration: migrations/create-user-management-functions.sql in your Supabase SQL Editor.'
      )
    }
    throw new Error(`Failed to fetch users: ${error.message}`)
  }
  
  return (data || []).map((user: any) => ({
    id: user.id,
    email: user.email,
    name: user.name || null,
    role: user.role || 'user',
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
  }))
}

// Update user role
export const updateUserRole = async (userId: string, role: 'admin' | 'user'): Promise<boolean> => {
  // Use RPC function to update user role
  const { error } = await supabase.rpc('update_user_role', {
    user_id: userId,
    new_role: role
  })
  
  if (error) {
    if (error.message.includes('function') || error.message.includes('does not exist')) {
      throw new Error(
        'Database function not found. Please run the migration: migrations/create-user-management-functions.sql in your Supabase SQL Editor.'
      )
    }
    if (error.message.includes('Only admins')) {
      throw new Error('Only admins can update user roles')
    }
    throw new Error(`Failed to update user role: ${error.message}`)
  }
  
  return true
}

// Update user role by email
export const updateUserRoleByEmail = async (email: string, role: 'admin' | 'user'): Promise<boolean> => {
  // Use RPC function to update user role by email
  const { error } = await supabase.rpc('update_user_role_by_email', {
    user_email: email,
    new_role: role
  })
  
  if (error) {
    if (error.message.includes('function') || error.message.includes('does not exist')) {
      throw new Error(
        'Database function not found. Please run the migration: migrations/create-user-management-functions.sql in your Supabase SQL Editor.'
      )
    }
    if (error.message.includes('Only admins')) {
      throw new Error('Only admins can update user roles')
    }
    throw new Error(`Failed to update user role: ${error.message}`)
  }
  
  return true
}

// Get user by ID
export const getUserById = async (userId: string): Promise<UserDetails> => {
  const { data, error } = await supabase.rpc('get_user_by_id', {
    user_id: userId
  })
  
  if (error) {
    if (error.message.includes('function') || error.message.includes('does not exist')) {
      throw new Error(
        'Database function not found. Please run the migration: migrations/add-user-management-functions.sql in your Supabase SQL Editor.'
      )
    }
    if (error.message.includes('Only admins')) {
      throw new Error('Only admins can view user details')
    }
    throw new Error(`Failed to fetch user: ${error.message}`)
  }
  
  if (!data || data.length === 0) {
    throw new Error('User not found')
  }
  
  const user = data[0]
  return {
    id: user.id,
    email: user.email,
    name: user.name || null,
    role: user.role || 'user',
    phone: user.phone || null,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
  }
}

// Delete user
export const deleteUser = async (userId: string): Promise<boolean> => {
  const { error } = await supabase.rpc('delete_user', {
    user_id: userId
  })
  
  if (error) {
    if (error.message.includes('function') || error.message.includes('does not exist')) {
      throw new Error(
        'Database function not found. Please run the migration: migrations/add-user-management-functions.sql in your Supabase SQL Editor.'
      )
    }
    if (error.message.includes('Only admins')) {
      throw new Error('Only admins can delete users')
    }
    if (error.message.includes('cannot delete your own')) {
      throw new Error('You cannot delete your own account')
    }
    throw new Error(`Failed to delete user: ${error.message}`)
  }
  
  return true
}

// Update user email
export const updateUserEmail = async (userId: string, newEmail: string): Promise<boolean> => {
  const { error } = await supabase.rpc('update_user_email', {
    user_id: userId,
    new_email: newEmail
  })
  
  if (error) {
    if (error.message.includes('function') || error.message.includes('does not exist')) {
      throw new Error(
        'Database function not found. Please run the migration: migrations/add-user-management-functions.sql in your Supabase SQL Editor.'
      )
    }
    if (error.message.includes('Only admins')) {
      throw new Error('Only admins can update user emails')
    }
    if (error.message.includes('already exists')) {
      throw new Error('Email already exists')
    }
    if (error.message.includes('Invalid email')) {
      throw new Error('Invalid email format')
    }
    throw new Error(`Failed to update email: ${error.message}`)
  }
  
  return true
}

// Update user details (name, phone, role)
export interface UpdateUserDetails {
  name?: string
  phone?: string
  role?: 'admin' | 'user'
}

export const updateUserDetails = async (
  userId: string, 
  details: UpdateUserDetails
): Promise<boolean> => {
  const { error } = await supabase.rpc('update_user_details', {
    user_id: userId,
    new_name: details.name || null,
    new_phone: details.phone || null,
    new_role: details.role || null
  })
  
  if (error) {
    if (error.message.includes('function') || error.message.includes('does not exist')) {
      throw new Error(
        'Database function not found. Please run the migration: migrations/add-user-management-functions.sql in your Supabase SQL Editor.'
      )
    }
    if (error.message.includes('Only admins')) {
      throw new Error('Only admins can update user details')
    }
    if (error.message.includes('Invalid role')) {
      throw new Error('Invalid role. Must be "admin" or "user"')
    }
    throw new Error(`Failed to update user details: ${error.message}`)
  }
  
  return true
}

