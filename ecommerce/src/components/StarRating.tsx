import { useState } from 'react';
import starEmptyIcon from '../assets/stars/star-empty-icon.svg';
import starFilledIcon from '../assets/stars/star-symbol-icon.svg';

const StarRating = () => {
  const [star1, setStar1] = useState(false);
  const [star2, setStar2] = useState(false);
  const [star3, setStar3] = useState(false);
  const [star4, setStar4] = useState(false);
  const [star5, setStar5] = useState(false);

  const toggleStar1 = () => {
    setStar1(!star1);
  };

  const toggleStar2 = () => {
    const newValue = !star2;   
    setStar2(newValue);
    setStar1(newValue);        
  };

  const toggleStar3 = () => {
    const newValue = !star3;
    setStar3(newValue);
    setStar2(newValue);
    setStar1(newValue);
  };

  const toggleStar4 = () => {
    const newValue = !star4;
    setStar4(newValue);
    setStar3(newValue);
    setStar2(newValue);
    setStar1(newValue);
  };

  const toggleStar5 = () => {
    const newValue = !star5;
    setStar5(newValue);
    setStar4(newValue);
    setStar3(newValue);
    setStar2(newValue);
    setStar1(newValue);
  };

  return (
    <div className='flex gap-1'>
      
      <img width={20} onClick={toggleStar1} src={star1 ? starFilledIcon : starEmptyIcon} />

      <img width={20} onClick={toggleStar2} src={star2 ? starFilledIcon : starEmptyIcon} />

      <img width={20} onClick={toggleStar3} src={star3 ? starFilledIcon : starEmptyIcon} />

      <img width={20} onClick={toggleStar4} src={star4 ? starFilledIcon : starEmptyIcon} />

      <img width={20} onClick={toggleStar5} src={star5 ? starFilledIcon : starEmptyIcon} />
    </div>
  );
};

export default StarRating;
