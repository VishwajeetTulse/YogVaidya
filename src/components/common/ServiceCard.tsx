import React from 'react';
import { Check } from 'lucide-react';
import Image from 'next/image';

interface ServiceCardProps {
  title: string;
  description: string;
  color: 'blue' | 'pink';
  imgUrl: string;
  comingSoon?: boolean;
  bulletsItems?: string[];
}

export default function ServiceCard({ 
  title, 
  description, 
  color, 
  imgUrl,
  bulletsItems = []
}: ServiceCardProps) {
  const getBgColor = () => {
    if (color === 'blue') return 'from-[#76d2fa] to-[#5a9be9]';
    if (color === 'pink') return 'from-[#ffa6c5] to-[#ff7dac]';
    return '';
  };

  return (
    <div className={`relative bg-gradient-to-b ${getBgColor()} rounded-3xl overflow-hidden h-[400px] p-7 flex flex-col shadow-xl hover:shadow-2xl transition-all duration-300`}>
      {/* Card arc decoration */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full"></div>
      
      {/* White card section */}
      <div className="bg-white rounded-2xl p-6 mb-auto w-4/5 shadow-md relative z-10">
        <div className="flex justify-between items-start">
          <div className="relative w-16 h-16">
            <Image 
              src={imgUrl} 
              alt={title}
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mt-4">{title}</h3>
        
        {bulletsItems.length > 0 && (
          <ul className="mt-5 space-y-3">
            {bulletsItems.map((item, index) => (
              <li key={index} className="flex items-center">
                <span className={`flex items-center justify-center w-5 h-5 rounded-full ${color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'} mr-3`}>
                  <Check className="w-3 h-3" />
                </span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Bottom text */}
      <div className="mt-auto relative z-10">
        <p className="text-white text-xl font-medium">{description}</p>
      </div>
    </div>
  );
} 