import { Product, ProductCreate } from "../types/productTypes";

// In-memory store for mock data
let mockProducts: Product[] = [
  {
    id: 1,
    name: "T-SHIRT WITH TAPE DETAILS",
    price: 20.00,
    originalPrice: 30.00,
    discount: 30,
    rating: 4.5,
    reviewCount: 10,
    image: "/images/prod1.png",
    description: "Comfortable t-shirt with stylish tape details",
    inStock: true,
    category: "T-Shirts"
  },
];

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a unique ID for new products
const generateId = (): number => {
  return Math.max(0, ...mockProducts.map(p => p.id)) + 1;
};

/**
 * CRUD Operations
 */

// Create: Add a new product
export const createProduct = async (productData: ProductCreate): Promise<Product> => {
  await delay(300); // Simulate network delay
  
  const newProduct: Product = {
    id: generateId(),
    ...productData,
    rating: 0,
    reviewCount: 0,
    discount: productData.originalPrice > 0 
      ? Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100) 
      : 0,
    inStock: productData.inStock ?? true
  };
  
  mockProducts = [...mockProducts, newProduct];
  return newProduct;
};

// Read: Get all products
export const getProducts = async (): Promise<Product[]> => {
  await delay(200); // Simulate network delay
  return [...mockProducts];
};

// Read: Get single product by ID
export const getProductById = async (id: number): Promise<Product | undefined> => {
  await delay(200); // Simulate network delay
  return mockProducts.find(product => product.id === id);
};

// Update: Full product update
export const updateProduct = async (id: number, updates: Partial<Product>): Promise<Product | undefined> => {
  await delay(300); // Simulate network delay
  
  const index = mockProducts.findIndex(p => p.id === id);
  if (index === -1) return undefined;
  
  // Recalculate discount if price or originalPrice changed
  if (updates.price !== undefined || updates.originalPrice !== undefined) {
    const price = updates.price ?? mockProducts[index].price;
    const originalPrice = updates.originalPrice ?? mockProducts[index].originalPrice;
    updates.discount = originalPrice > 0 
      ? Math.round(((originalPrice - price) / originalPrice) * 100) 
      : 0;
  }
  
  const updatedProduct = { ...mockProducts[index], ...updates, id };
  mockProducts = [
    ...mockProducts.slice(0, index),
    updatedProduct,
    ...mockProducts.slice(index + 1)
  ];
  
  return updatedProduct;
};

// Update: Just the rating (kept for backward compatibility)
export const updateProductRating = async (productId: number, newRating: number): Promise<boolean> => {
  const product = await getProductById(productId);
  if (!product) return false;
  
  const newReviewCount = product.reviewCount + 1;
  const updatedRating = ((product.rating * product.reviewCount) + newRating) / newReviewCount;
  
  await updateProduct(productId, {
    rating: parseFloat(updatedRating.toFixed(1)),
    reviewCount: newReviewCount
  });
  
  return true;
};

// Delete: Remove a product
export const deleteProduct = async (id: number): Promise<boolean> => {
  await delay(300); // Simulate network delay
  
  const initialLength = mockProducts.length;
  mockProducts = mockProducts.filter(product => product.id !== id);
  
  return mockProducts.length < initialLength;
};

// Cart Operations

export const addToCart = async (productId: number, quantity: number = 1): Promise<boolean> => {
  // In a real app: await fetch('/api/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) });
  console.log(`Added ${quantity} of product ${productId} to cart`);
  return true;
};
