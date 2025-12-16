-- Supabase Storage Policies for Product Images
-- Run this SQL in your Supabase SQL Editor to set up storage policies

-- First, ensure the bucket exists (create it manually in the Storage UI if it doesn't)
-- Bucket name: product-images
-- Make it public: true

-- Policy 1: Allow authenticated users to upload images
-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Policy 2: Allow public read access to images
-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy 3: Allow authenticated users to update their own uploads (optional)
-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Policy 4: Allow authenticated users to delete images (optional)
-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

