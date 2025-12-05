import Banner from '../../components/banner'
import { NavBar } from '../../components/NavBar'
import Hero from './Hero'

const HomePage = () => {
  return (
    <div> 
      <Banner />
      <NavBar />
      <div className="pt-[102px] md:pt-[118px]">
        <Hero />
      </div>
    </div>
  )
}

export default HomePage