-- Complete User Management Functions
-- Run this in your Supabase SQL Editor to enable full user control (edit, delete, update email)

-- ============================================
-- Function 1: Delete User
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_user(
  user_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if the current user is admin
  SELECT raw_user_meta_data->>'role' INTO current_user_role
  FROM auth.users
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
  
  -- Prevent self-deletion
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;
  
  -- Delete user from auth.users
  DELETE FROM auth.users
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- ============================================
-- Function 2: Update User Email
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_email(
  user_id UUID,
  new_email TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if the current user is admin
  SELECT raw_user_meta_data->>'role' INTO current_user_role
  FROM auth.users
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update user emails';
  END IF;
  
  -- Validate email format (basic check)
  IF new_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = new_email AND id != user_id) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;
  
  -- Update user email
  UPDATE auth.users
  SET email = new_email,
      email_confirmed_at = NULL  -- Require email confirmation
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_email(UUID, TEXT) TO authenticated;

-- ============================================
-- Function 3: Update User Details (name, phone, role)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_details(
  user_id UUID,
  new_name TEXT DEFAULT NULL,
  new_phone TEXT DEFAULT NULL,
  new_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_role TEXT;
  existing_data JSONB;
BEGIN
  -- Check if the current user is admin
  SELECT raw_user_meta_data->>'role' INTO current_user_role
  FROM auth.users
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update user details';
  END IF;
  
  -- Get existing user metadata
  SELECT raw_user_meta_data INTO existing_data
  FROM auth.users
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Validate role if provided
  IF new_role IS NOT NULL AND new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role. Must be "admin" or "user"';
  END IF;
  
  -- Build updated metadata, preserving existing values if new ones are not provided
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'role', COALESCE(new_role, existing_data->>'role', 'user'),
    'name', COALESCE(new_name, existing_data->>'name', ''),
    'phone', COALESCE(new_phone, existing_data->>'phone', '')
  )
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_details(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================
-- Function 4: Get Single User by ID
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_by_id(
  user_id UUID
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_role TEXT;
  user_exists BOOLEAN;
BEGIN
  -- Check if the current user is admin (explicitly reference auth.users table)
  SELECT u.raw_user_meta_data->>'role' INTO current_user_role
  FROM auth.users u
  WHERE u.id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can view user details';
  END IF;
  
  -- Check if user exists (explicitly reference auth.users table)
  SELECT EXISTS(SELECT 1 FROM auth.users u WHERE u.id = user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE(u.raw_user_meta_data->>'name', '')::TEXT as name,
    COALESCE(u.raw_user_meta_data->>'role', 'user')::TEXT as role,
    COALESCE(u.raw_user_meta_data->>'phone', '')::TEXT as phone,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  WHERE u.id = user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_by_id(UUID) TO authenticated;

-- ============================================
-- Verify All Functions Created
-- ============================================

SELECT 
  routine_schema,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_all_users', 
  'update_user_role', 
  'update_user_role_by_email',
  'delete_user', 
  'update_user_email', 
  'update_user_details', 
  'get_user_by_id'
)
ORDER BY routine_name;

