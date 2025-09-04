import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

interface PricingFeature {
  text: string;
}

interface PricingCardProps {
  title: string;
  subtitle: string;
  price: string;
  priceUnit?: string;
  features: PricingFeature[];
  buttonText: string;
  buttonHref: string;
  featured?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
  title, 
  subtitle, 
  price, 
  priceUnit, 
  features, 
  buttonText, 
  buttonHref, 
  featured = false 
}) => (
  <div className={`p-8 rounded-xl border text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
    featured 
      ? 'bg-white text-black border-none scale-105' 
      : 'bg-gray-900 border-white/10 hover:shadow-black/20'
  }`}>
    <h3 className="text-2xl font-bold mb-2">{title}</h3>
    <p className={`mb-5 ${featured ? 'text-gray-600' : 'text-gray-400'}`}>
      {subtitle}
    </p>
    
    <div className="mb-8">
      <span className="text-4xl lg:text-5xl font-bold">{price}</span>
      {priceUnit && (
        <span className={`text-base ${featured ? 'text-gray-600' : 'text-gray-400'} font-normal`}>
          {priceUnit}
        </span>
      )}
    </div>
    
    <ul className="list-none p-0 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="mb-4 flex items-center">
          <Check className={`w-5 h-5 mr-3 ${featured ? 'text-black' : 'text-white'}`} />
          <span>{feature.text}</span>
        </li>
      ))}
    </ul>
    
    <Link 
      href={buttonHref}
      className={`block w-full text-center py-4 px-6 rounded-lg font-medium transition-all duration-300 no-underline ${
        featured
          ? 'bg-black text-white hover:bg-gray-800'
          : 'bg-gray-800 text-white border border-gray-600 hover:bg-gray-700'
      }`}
    >
      {buttonText}
    </Link>
  </div>
);

const ParallaxSection: React.FC = () => (
  <section 
    id="pricing" 
    className="min-h-screen bg-cover bg-center bg-fixed flex justify-center items-center relative text-center"
    style={{
      backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop')"
    }}
  >
    <div className="absolute inset-0 bg-black/60 z-0"></div>
    <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-black to-transparent z-0"></div>
    
    <h1 className="relative z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold px-5 text-shadow-lg">
      A plan for each creator.
    </h1>
  </section>
);

const Pricing: React.FC = () => {
  const plans = [
    {
      title: "Free",
      subtitle: "For who is starting now.",
      price: "$0",
      priceUnit: "/month",
      features: [
        { text: "Export in 720p" },
        { text: " 15 min of video" },
        { text: "Standard support" },
        { text: "Watermark included" }
      ],
      buttonText: "Start Free",
      buttonHref: "/register"
    },
    {
      title: "Starter",
      subtitle: "For beginners who wants more power.",
      price: "$9.99",
      priceUnit: "/month",
      features: [
        { text: "Export videos in Full HD 1080p" },
        { text: " 120 min of video" },
        { text: "Access to all features" },
        { text: "Standard support" },
        { text: "No watermark" }
      ],
      buttonText: "Choose Starter",
      buttonHref: "/register",
      featured: true
    },
    {
      title: "Creator",
      subtitle: "For premium creators.",
      price: "$24.99",
      features: [
        { text: "Export videos in Full HD 1080p" },
        { text: " 400 min of video" },
        { text: "Access to all features" },
        { text: "Subtitles support" },
        { text: "AI support for context" },
        { text: "Branding template" },
        { text: "Priority processing" },
        { text: "Custom branding" },
      ],
      buttonText: "Choose Creator",
      buttonHref: "/contact"
    },
    {
      title: "Producer",
      subtitle: "For Podcasters and agencies.",
      price: "$69.99",
      features: [
        { text: "Export videos in Full HD 1080p" },
        { text: " 1200 min of video" },
        { text: "Access to all features" },
        { text: "Subtitles support" },
        { text: "AI support for context" },
        { text: "Branding template" },
        { text: "Priority support via chat" },
        { text: "No queue for processing videos" }
      ],
      buttonText: "Choose Creator",
      buttonHref: "/register"
    }
  ];

  return (
    <>
      <ParallaxSection />
      
      <section className="py-16 lg:py-24 px-[5%] bg-black text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">
          Find your perfect plan.
        </h2>
        <p className="text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-16 text-gray-300">
          Start creating with our free plan, or choose one of our premium plans for more features and flexibility.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
        </div>
      </section>
    </>
  );
};

export default Pricing;