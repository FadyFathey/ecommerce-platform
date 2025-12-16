-- Fix ambiguous column reference in get_user_by_id function
-- Run this in your Supabase SQL Editor

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



