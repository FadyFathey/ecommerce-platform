import heroImage from '../../assets/hero.jpg'
import starTopRight from '../../assets/Vector-top-right.svg'
import starTopLeft from '../../assets/Vector-tow-left.svg'

const Hero = () => {

  return (
    <div className="relative w-full bg-[#f2f0f1] overflow-hidden">
      {/* Decorative Stars - Desktop only */}
      <img 
        src={starTopRight} 
        alt="" 
        className="absolute top-[86px] right-[81px] w-[104px] h-[104px] z-0 hidden xl:block"
      />
      <img 
        src={starTopLeft} 
        alt="" 
        className="absolute top-[120px] left-[48%] w-[60px] h-[60px] z-10 hidden xl:block"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="relative z-10 text-center lg:text-left order-2 lg:order-1">
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black leading-tight mb-4 sm:mb-6">
              FIND CLOTHES
              <br />
              THAT MATCHES
              <br />
              YOUR STYLE
            </h1>

            {/* Description */}
            <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0">
              Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.
            </p>

            {/* Shop Now Button */}
            <button className="bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium hover:opacity-90 transition-opacity mb-8 sm:mb-10 md:mb-12 w-full sm:w-auto">
              Shop Now
            </button>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-1">200+</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">International Brands</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-1">2,000+</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">High-Quality Products</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-1">30,000+</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600">Happy Customers</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px] overflow-hidden order-1 lg:order-2">
            <img 
              alt="Fashion models" 
              src={heroImage}
              className="w-full h-full object-contain object-center lg:object-right"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero