import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import pro1 from "../assets/prodcuts/prod1.png"; // fallback image
import type { RootState } from "../store";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { getAllProducts } from "../store/slices/CardSlice";
import { addItem } from "../store/slices/cartSlice";
import type { Product } from "../types/productTypes";

const ProductCard = () => {
  const dispatch = useAppDispatch();
  const { products, loading, error } = useAppSelector(
    (state: RootState) => state.products
  );

  useEffect(() => {
    dispatch(getAllProducts());
  }, [dispatch]);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p>Error: {error}</p>;
  if (products.length === 0) return <p>No products found.</p>;

  return (
    <>
      {products.map((product) => (
        <ProductCardItem key={product.id} product={product} />
      ))}
    </>
  );
};

// Separate component for each product card to manage individual image state
const ProductCardItem = ({ product }: { product: Product }) => {
  const dispatch = useAppDispatch();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Get all available images for this product
  const getProductImages = (): string[] => {
    const images: string[] = [];
    
    // Add main image first
    if (product.image_url) {
      images.push(product.image_url);
    }
    
    // Add additional images from image_urls array
    if (product.image_urls && Array.isArray(product.image_urls)) {
      product.image_urls.forEach(img => {
        if (img && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    // Add thumbnail if different
    if (product.thumbnail_url && !images.includes(product.thumbnail_url)) {
      images.push(product.thumbnail_url);
    }
    
    // Fallback to default image if no images found
    return images.length > 0 ? images : [pro1];
  };

  const images = getProductImages();
  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex] || pro1;

  // Auto-rotate images on hover if multiple images exist
  useEffect(() => {
    if (isHovered && hasMultipleImages) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 2000); // Change image every 2 seconds

      return () => clearInterval(interval);
    }
  }, [isHovered, hasMultipleImages, images.length]);

  return (
    <div
      className="w-full bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-200 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0); // Reset to first image on mouse leave
      }}
    >
      {/* Product Image - Clickable */}
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden cursor-pointer">
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              // Fallback to default image if Supabase image fails to load
              const target = e.target as HTMLImageElement;
              if (target.src !== pro1) {
                target.src = pro1;
              }
            }}
          />
          
          {/* Image Indicators (dots) - Show if multiple images */}
          {hasMultipleImages && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'bg-white scale-125'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Image Counter Badge - Show if multiple images */}
          {hasMultipleImages && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {currentImageIndex + 1}/{images.length}
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        {/* Title - Clickable */}
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] hover:text-gray-600 transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline">
            <span className="text-base font-bold text-gray-900">
              ${(product.price_cents / 100).toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 ml-1">
              {product.currency || 'USD'}
            </span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          className="w-full bg-black text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-gray-800 active:bg-gray-900 transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(addItem({ product, quantity: 1 }));
            toast.success("Added to cart");
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
