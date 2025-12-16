import { supabase } from '../lib/supabase'

const PRODUCT_BUCKET = 'product-images'
const CATEGORY_BUCKET = 'category-images'

/**
 * Upload an image file to Supabase Storage
 * @param file - The file to upload
 * @param productId - Optional product ID to organize files
 * @returns The public URL of the uploaded image
 */
export const uploadProductImage = async (
  file: File,
  productId?: string
): Promise<string> => {
  try {
    validateImageFile(file)
    // Generate a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = productId ? `${productId}/${fileName}` : fileName

    // Upload the file
    const { data, error } = await supabase.storage
      .from(PRODUCT_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(PRODUCT_BUCKET)
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 */
export const deleteProductImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.indexOf(PRODUCT_BUCKET)
    
    if (bucketIndex === -1) {
      throw new Error('Invalid image URL')
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    const { error } = await supabase.storage
      .from(PRODUCT_BUCKET)
      .remove([filePath])

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate if a file is a valid image
 * @param file - The file to validate
 * @returns True if valid, throws error if invalid
 */
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.')
  }

  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit.')
  }

  return true
}

/**
 * Upload a category image (stored in a separate bucket)
 */
export const uploadCategoryImage = async (file: File, categoryId?: string): Promise<string> => {
  validateImageFile(file)

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = categoryId ? `${categoryId}/${fileName}` : fileName

  const { data, error } = await supabase.storage
    .from(CATEGORY_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(CATEGORY_BUCKET)
    .getPublicUrl(data.path)

  return publicUrl
}

