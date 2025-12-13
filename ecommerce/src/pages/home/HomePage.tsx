import Banner from '../../components/banner'
import { NavBar } from '../../components/NavBar'
import ProdcutCard from '../../components/ProdcutCard'
import SectionHeading from '../../components/SectionHeading'
import Brands from '../Brands'
import Hero from './Hero'

const HomePage = () => {
  // Create an array of 4 items to demonstrate the grid
  const productCards = Array(4).fill(0);

  return (
    <div> 
      <Banner />
      <NavBar />
      <div className="pt-[102px] md:pt-[118px] px-4 sm:px-6">
        <Hero />
        <Brands />
        <SectionHeading title="NEW ARRIVALS" viewAllLink="#" className='mb-6' />
        
        {/* Responsive Grid Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productCards.map((_, index) => (
            <div key={index} className="w-full">
              <ProdcutCard/>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomePage