import type { Product, ProductCreate, ProductUpdate, ProductReview } from "../types/productTypes";
import { supabase } from "../lib/supabase";

/**
 * CRUD Operations using Supabase
 */

// Create: Add a new product
export const createProduct = async (productData: {
  name: string;
  slug: string;
  description?: string;
  short_description?: string | null;
  price_cents: number;
  original_price_cents?: number | null;
  currency?: string;
  image_url: string | null;
  image_urls?: string[] | null;
  category_id: string;
  status?: string;
  sku?: string | null;
  stock_quantity?: number;
  is_featured?: boolean;
  is_new?: boolean;
}): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: productData.name,
      slug: productData.slug,
      description: productData.description || '',
      short_description: productData.short_description || null,
      price_cents: productData.price_cents,
      original_price_cents: productData.original_price_cents || null,
      currency: productData.currency || 'USD',
      image_url: productData.image_url,
      image_urls: productData.image_urls || [],
      category_id: productData.category_id,
      status: productData.status || 'active',
      sku: productData.sku || null,
      stock_quantity: productData.stock_quantity || 0,
      is_featured: productData.is_featured || false,
      is_new: productData.is_new || false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  return data;
};

// Read: Get all products
export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return data || [];
};

// Read: Get single product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  return data;
};

// Update: Full product update
export const updateProduct = async (id: string, updates: {
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string | null;
  price_cents?: number;
  original_price_cents?: number | null;
  currency?: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  category_id?: string;
  status?: string;
  sku?: string | null;
  stock_quantity?: number;
  is_featured?: boolean;
  is_new?: boolean;
}): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }

  return data;
};

// Update: Just the rating (kept for backward compatibility)
export const updateProductRating = async (productId: string, newRating: number): Promise<boolean> => {
  try {
    // This would require a ratings table or additional fields
    // For now, we'll just return true
    console.log(`Rating update for product ${productId}: ${newRating}`);
    return true;
  } catch (error) {
    return false;
  }
};

// Delete: Remove a product
export const deleteProduct = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  return true;
};

// Cart Operations

export const addToCart = async (productId: string, quantity: number = 1): Promise<boolean> => {
  // In a real app: await fetch('/api/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) });
  console.log(`Added ${quantity} of product ${productId} to cart`);
  return true;
};

// Get product reviews
export const getProductReviews = async (productId: string): Promise<ProductReview[]> => {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  return data || [];
};

// Get related products (same category, excluding current product)
export const getRelatedProducts = async (productId: string, categoryId: string, limit: number = 4): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .neq('id', productId)
    .eq('status', 'active')
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch related products: ${error.message}`);
  }

  return data || [];
};

// Get products by category id
export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch products by category: ${error.message}`);
  }

  return data || [];
};

// Create a product review
export const createProductReview = async (reviewData: {
  product_id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
}): Promise<ProductReview> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to submit a review');
  }

  const { data, error } = await supabase
    .from('product_reviews')
    .insert({
      product_id: reviewData.product_id,
      user_id: user.id,
      rating: reviewData.rating,
      title: reviewData.title || null,
      comment: reviewData.comment || null,
      is_verified_purchase: false, // You can update this based on order history
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create review: ${error.message}`);
  }

  return data;
};

// Update a product review (only by the author)
export const updateProductReview = async (reviewId: string, updates: {
  rating?: number;
  title?: string | null;
  comment?: string | null;
}): Promise<ProductReview> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to update a review');
  }

  const { data, error } = await supabase
    .from('product_reviews')
    .update(updates)
    .eq('id', reviewId)
    .eq('user_id', user.id) // Ensure only the author can update
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update review: ${error.message}`);
  }

  return data;
};

// Delete a product review (only by the author)
export const deleteProductReview = async (reviewId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to delete a review');
  }

  const { error } = await supabase
    .from('product_reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id); // Ensure only the author can delete

  if (error) {
    throw new Error(`Failed to delete review: ${error.message}`);
  }

  return true;
};