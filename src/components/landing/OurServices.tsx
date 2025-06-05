import React from 'react';
import ServiceCard from '@/components/common/ServiceCard';
import { Sparkles } from 'lucide-react';

// Custom image URLs for the service cards using publicly available icons
const SERVICE_IMAGES = {
  // Yoga instructor/mentor
  yogaMentor: "/assets/yoga.svg",
  
  // Healthy food/diet plan
  dietPlan: "/assets/diet-plan.svg",
  
  // Meditation with lotus position
  meditation: "/assets/meditation.svg"
};

export default function OurServices() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-24 relative" id="services">
      {/* Background decoration */}
      <div className="absolute top-10 right-10 opacity-30">
        <Sparkles className="w-20 h-20 text-indigo-400" />
      </div>
      <div className="absolute bottom-10 left-10 opacity-20">
        <div className="w-32 h-32 rounded-full bg-pink-200"></div>
      </div>
      
      <div className="text-center mb-16 relative z-10">
        <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-4">Our Expertise</span>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Our Services</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Comprehensive yoga solutions designed to improve your physical and mental well-being
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
        {/* Live Session Card */}
        <div className="transform transition-transform hover:-translate-y-2 duration-300">
          <ServiceCard 
            title="Live Session" 
            description="Connect with our expert instructor for personalized guidance."
            color="blue"
            imgUrl={SERVICE_IMAGES.yogaMentor}
            bulletsItems={[
              "One-on-one coaching",
              "Real-time feedback",
              "Personalized routines"
            ]}
          />
        </div>
        
        {/* Diet Plan Card */}
        <div className="transform transition-transform hover:-translate-y-2 duration-300">
          <ServiceCard 
            title="Diet Plan" 
            description="Nutritional guidance to complement your yoga practice."
            color="pink"
            imgUrl={SERVICE_IMAGES.dietPlan}
            bulletsItems={[
              "Custom meal plans",
              "Ayurvedic principles",
              "Nutritional counseling"
            ]}
          />
        </div>
        
        {/* Meditation Session Card */}
        <div className="transform transition-transform hover:-translate-y-2 duration-300">
          <ServiceCard 
            title="Meditation Session" 
            description="Guided meditation experiences for inner peace."
            color="blue"
            imgUrl={SERVICE_IMAGES.meditation}
            comingSoon={true}
            bulletsItems={[
              "Mindfulness techniques",
              "Guided sessions",
              "Stress reduction"
            ]}
          />
        </div>
      </div>
    </section>
  );
} 