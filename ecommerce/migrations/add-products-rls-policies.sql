-- Migration: Add Row Level Security (RLS) Policies for Products Table
-- Run this in your Supabase SQL Editor to fix the "violates row-level security policy" error

-- ============================================
-- Enable RLS on products table (if not already enabled)
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for Products Table
-- ============================================

-- Policy 1: Anyone can view active products (SELECT)
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products"
    ON products FOR SELECT
    USING (
        status = 'active' 
        AND (deleted_at IS NULL)
    );

-- Policy 2: Authenticated users can create products (INSERT)
-- This allows any logged-in user to create products
-- If you want only admins, change auth.role() = 'authenticated' to check for admin role
DROP POLICY IF EXISTS "Authenticated users can create products" ON products;
CREATE POLICY "Authenticated users can create products"
    ON products FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Authenticated users can update products (UPDATE)
-- This allows any logged-in user to update products
-- You can restrict this to only the creator by checking created_by = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
CREATE POLICY "Authenticated users can update products"
    ON products FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: Authenticated users can delete products (DELETE)
-- This allows any logged-in user to delete products
-- You can restrict this to only the creator by checking created_by = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;
CREATE POLICY "Authenticated users can delete products"
    ON products FOR DELETE
    USING (auth.role() = 'authenticated');

-- ============================================
-- Alternative: More Restrictive Policies (Admin Only)
-- ============================================
-- If you want only admins to create/update/delete products, 
-- uncomment and use these policies instead:

/*
-- Policy 2 (Admin Only): Only admins can create products
DROP POLICY IF EXISTS "Admins can create products" ON products;
CREATE POLICY "Admins can create products"
    ON products FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy 3 (Admin Only): Only admins can update products
DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products"
    ON products FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy 4 (Admin Only): Only admins can delete products
DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products"
    ON products FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );
*/

-- ============================================
-- Verify Policies
-- ============================================
-- Run this query to see all policies on the products table:
-- SELECT * FROM pg_policies WHERE tablename = 'products';




