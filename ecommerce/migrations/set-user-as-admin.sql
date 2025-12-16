-- How to Set a User as Admin in Supabase
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- Method 1: Update User Metadata via SQL (Recommended)
-- ============================================

-- Replace 'user-email@example.com' with the actual email of the user you want to make admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'admin',
  'name', COALESCE(raw_user_meta_data->>'name', ''),
  'phone', COALESCE(raw_user_meta_data->>'phone', '')
)
WHERE email = 'user-email@example.com';

-- Or update by user ID (replace 'user-id-here' with the actual user UUID)
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_build_object(
--   'role', 'admin',
--   'name', COALESCE(raw_user_meta_data->>'name', ''),
--   'phone', COALESCE(raw_user_meta_data->>'phone', '')
-- )
-- WHERE id = 'user-id-here';

-- ============================================
-- Method 2: View All Users and Their Roles
-- ============================================

-- See all users and their current roles
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'name' as name,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- Method 3: Set Multiple Users as Admin
-- ============================================

-- Set multiple users as admin by email list
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'admin',
  'name', COALESCE(raw_user_meta_data->>'name', ''),
  'phone', COALESCE(raw_user_meta_data->>'phone', '')
)
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
);

-- ============================================
-- Method 4: Remove Admin Role
-- ============================================

-- Remove admin role from a user (set to null or 'user')
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'user',
  'name', COALESCE(raw_user_meta_data->>'name', ''),
  'phone', COALESCE(raw_user_meta_data->>'phone', '')
)
WHERE email = 'user-email@example.com';

-- ============================================
-- Verify Admin Role
-- ============================================

-- Check if a specific user is admin
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  CASE 
    WHEN raw_user_meta_data->>'role' = 'admin' THEN 'Yes'
    ELSE 'No'
  END as is_admin
FROM auth.users
WHERE email = 'user-email@example.com';




