-- Migration: Add missing product fields for production
-- Run this in your Supabase SQL Editor

-- ============================================
-- PHASE 1: Essential Fields
-- ============================================

-- Add status field (active/inactive/draft)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'draft', 'archived'));

-- Add original price for discounts
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS original_price_cents INTEGER;

-- Add stock quantity
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Add SKU (Stock Keeping Unit)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;

-- Add updated_at timestamp (auto-update)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PHASE 2: Product Variants Table
-- ============================================

-- Create product_variants table for colors, sizes, etc.
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Red - Large"
    sku TEXT UNIQUE,
    color TEXT,
    size TEXT,
    price_cents INTEGER, -- Override product price if different
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- Trigger for updated_at on variants
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PHASE 2: Additional Product Fields
-- ============================================

-- Add multiple images (JSONB array)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Add thumbnail URL
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add brand reference (without foreign key constraint - brands table may not exist yet)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS brand_id UUID;

-- Add featured and new flags
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE;

-- Add short description for cards
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS short_description TEXT;

-- ============================================
-- PHASE 3: SEO & Marketing
-- ============================================

-- Add SEO fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Add tags (JSONB array)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- PHASE 3: Ratings & Reviews
-- ============================================

-- Add rating fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00 
CHECK (rating >= 0 AND rating <= 5);
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);

-- Trigger for updated_at on reviews
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
    BEFORE UPDATE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PHASE 3: Inventory & Shipping
-- ============================================

-- Add inventory management fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT TRUE;
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS allow_backorders BOOLEAN DEFAULT FALSE;

-- Add shipping fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS weight_grams INTEGER;
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS dimensions JSONB; -- {length, width, height, unit}

-- ============================================
-- PHASE 3: Additional Metadata
-- ============================================

-- Add soft delete
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add audit fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================
-- Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product_reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for product_variants (adjust based on your auth setup)
DROP POLICY IF EXISTS "Anyone can view active product variants" ON product_variants;
CREATE POLICY "Anyone can view active product variants"
    ON product_variants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_variants.product_id 
            AND products.status = 'active'
            AND products.deleted_at IS NULL
        )
    );

-- Policies for product_reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON product_reviews;
CREATE POLICY "Anyone can view approved reviews"
    ON product_reviews FOR SELECT
    USING (true); -- Adjust based on your moderation needs

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON product_reviews;
CREATE POLICY "Authenticated users can create reviews"
    ON product_reviews FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own reviews" ON product_reviews;
CREATE POLICY "Users can update their own reviews"
    ON product_reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to calculate discount percentage
CREATE OR REPLACE FUNCTION calculate_discount_percentage(
    price_cents INTEGER,
    original_price_cents INTEGER
) RETURNS INTEGER AS $$
BEGIN
    IF original_price_cents IS NULL OR original_price_cents <= price_cents THEN
        RETURN 0;
    END IF;
    RETURN ROUND(((original_price_cents - price_cents)::DECIMAL / original_price_cents) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update product rating from reviews
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM product_reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        review_count = (
            SELECT COUNT(*)
            FROM product_reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update product rating
DROP TRIGGER IF EXISTS update_product_rating_trigger ON product_reviews;
CREATE TRIGGER update_product_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

