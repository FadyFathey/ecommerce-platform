# How to Set a User as Admin in Supabase

This guide explains how to set a user's role to `admin` so they can access the admin dashboard.

## Method 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the SQL Query**
   - Copy and paste this SQL (replace the email with your user's email):
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_build_object(
     'role', 'admin',
     'name', COALESCE(raw_user_meta_data->>'name', ''),
     'phone', COALESCE(raw_user_meta_data->>'phone', '')
   )
   WHERE email = 'your-email@example.com';
   ```

3. **Click "Run"** to execute the query

4. **Verify the Role**
   - Run this query to check:
   ```sql
   SELECT 
     email,
     raw_user_meta_data->>'role' as role
   FROM auth.users
   WHERE email = 'your-email@example.com';
   ```

## Method 2: Using Supabase Dashboard (UI)

1. **Go to Authentication → Users**
   - In your Supabase dashboard, navigate to **Authentication** → **Users**

2. **Find Your User**
   - Search for the user by email

3. **Edit User Metadata**
   - Click on the user to open details
   - Scroll to **User Metadata** section
   - Click **Edit** or **Add Metadata**

4. **Add Role**
   - Add a new metadata key: `role`
   - Set the value to: `admin`
   - Click **Save**

## Method 3: Using User ID

If you know the user's ID (UUID), you can use:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'admin',
  'name', COALESCE(raw_user_meta_data->>'name', ''),
  'phone', COALESCE(raw_user_meta_data->>'phone', '')
)
WHERE id = 'user-uuid-here';
```

## View All Users and Their Roles

To see all users and their roles:

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'name' as name,
  created_at
FROM auth.users
ORDER BY created_at DESC;
```

## Remove Admin Role

To remove admin role from a user:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'user',
  'name', COALESCE(raw_user_meta_data->>'name', ''),
  'phone', COALESCE(raw_user_meta_data->>'phone', '')
)
WHERE email = 'user-email@example.com';
```

## Important Notes

- After updating the role, the user may need to **log out and log back in** for the changes to take effect
- The role is stored in `raw_user_meta_data->>'role'` in Supabase
- Only users with `role = 'admin'` can access `/admin/*` routes
- Non-admin users will be redirected to the home page with an error message

## Testing

1. Set your user as admin using one of the methods above
2. Log out from the application
3. Log back in
4. Try to access `/admin` - you should now have access!




