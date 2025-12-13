import React from 'react';
import type { SectionHeadingProps } from '../types/section.types';

const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  className = '',
}) => {
  return (
    <div className={`relative mb-8 mt-[50px] md:mt-[72px] text-center ${className}`}>
      <h2 className="sm:text-[32px]  md:text-[48px] font-bold text-gray-900 inline-block">{title}</h2>
      
    </div>
  );
};

export default SectionHeading;