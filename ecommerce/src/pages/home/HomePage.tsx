import Banner from '../../components/banner'
import { NavBar } from '../../components/NavBar'
import ProdcutCard from '../../components/ProdcutCard'
import SectionHeading from '../../components/SectionHeading'
import Brands from '../Brands'
import { CategoriesSection } from '../Categories'
import Hero from './Hero'
import HappyCustomers from './HappyCustomers'
import NewsletterSection from './NewsletterSection'
import Footer from '../../components/Footer'

const HomePage = () => {
  

  return (
    <div> 
      <Banner />
      <NavBar />
      <div className="pt-[102px] md:pt-[118px] px-4 sm:px-6">
        <Hero />
        <Brands />
        <SectionHeading title="NEW ARRIVALS" viewAllLink="#" className='mb-6' />
        
        {/* Responsive Grid Container */}
        <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ProdcutCard/>
        </div>

        {/* Categories section under product cards */}
        <div className="max-w-7xl mx-auto">
          <CategoriesSection />
          <HappyCustomers />
          <NewsletterSection />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default HomePage