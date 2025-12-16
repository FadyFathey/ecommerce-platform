-- Fix User Management Functions
-- Run this in your Supabase SQL Editor if you're getting "function not found" error

-- ============================================
-- Drop existing functions if they exist (to recreate them)
-- ============================================

DROP FUNCTION IF EXISTS get_all_users() CASCADE;
DROP FUNCTION IF EXISTS update_user_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_user_role_by_email(TEXT, TEXT) CASCADE;

-- ============================================
-- Function 1: Get All Users (for admin UI)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE(u.raw_user_meta_data->>'name', '')::TEXT as name,
    COALESCE(u.raw_user_meta_data->>'role', 'user')::TEXT as role,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO anon;

-- ============================================
-- Function 2: Update User Role by User ID
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_role(
  user_id UUID,
  new_role TEXT
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
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role. Must be "admin" or "user"';
  END IF;
  
  -- Update user role
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'role', new_role,
    'name', COALESCE(raw_user_meta_data->>'name', ''),
    'phone', COALESCE(raw_user_meta_data->>'phone', '')
  )
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;

-- ============================================
-- Function 3: Update User Role by Email
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_role_by_email(
  user_email TEXT,
  new_role TEXT
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
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role. Must be "admin" or "user"';
  END IF;
  
  -- Update user role
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'role', new_role,
    'name', COALESCE(raw_user_meta_data->>'name', ''),
    'phone', COALESCE(raw_user_meta_data->>'phone', '')
  )
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_user_role_by_email(TEXT, TEXT) TO authenticated;

-- ============================================
-- Verify Functions Created
-- ============================================

SELECT 
  routine_schema,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_all_users', 'update_user_role', 'update_user_role_by_email')
ORDER BY routine_name;




