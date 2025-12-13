import ver from "../assets/brands/versage.svg";
import zara from "../assets/brands/zara-logo-1 1.svg";
import cucci from "../assets/brands/gucci-logo-1 1.svg";
import prada from "../assets/brands/prada-logo-1 1.svg";
import calvin from "../assets/brands/calvin.svg";
const Brands = () => {
  return (
    <div className="w-full bg-black py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center gap-4 md:gap-8">
          <div className="flex-1 min-w-[150px] flex justify-center">
            <img src={ver} alt="versace" className="h-8 object-contain" />
          </div>
          <div className="flex-1 min-w-[150px] flex justify-center">
            <img src={zara} alt="zara" className="h-8 object-contain" />
          </div>
          <div className="flex-1 min-w-[150px] flex justify-center">
            <img src={cucci} alt="gucci" className="h-8 object-contain" />
          </div>
          <div className="flex-1 min-w-[150px] flex justify-center">
            <img src={prada} alt="prada" className="h-8 object-contain" />
          </div>
          <div className="flex-1 min-w-[150px] flex justify-center">
            <img src={calvin} alt="calvin klein" className="h-8 object-contain" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Brands