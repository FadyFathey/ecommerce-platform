
import pro1 from "../assets/prodcuts/prod1.png";
import StarRating from "./StarRating";


const ProdcutCard = () => {
  const ratingChanged = (newRating: number) => {
    console.log(newRating);
  };

  return (
    <div>
    <div className="w-full max-w-xs mx-auto bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="relative aspect-[3/4] sm:aspect-[9/12]">
        <img 
          src={pro1} 
          alt="T-SHIRT WITH TAPE DETAILS"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Discount Badge */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
          -30%
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4">
        {/* Title */}
        <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2 line-clamp-2 h-10 sm:h-12">
          T-SHIRT WITH TAPE DETAILS
        </h3>

        {/* Rating */}
        <div className="mb-1.5 flex items-center">
          <StarRating/>
          <span className="text-xs text-gray-500 ml-1">(10)</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline">
            <span className="text-base sm:text-lg font-bold text-gray-900">
              $20.00
            </span>
            <span className="text-xs sm:text-sm text-gray-400 line-through ml-1.5 sm:ml-2">
              $30.00
            </span>
          </div>
        </div>
        
        {/* Add to Cart Button */}
        <button 
          className="mt-3 w-full bg-black text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={() => console.log('Added to cart')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Add to Cart
        </button>
      </div>
    </div>
    </div>
    
  );
};

export default ProdcutCard;