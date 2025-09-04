import React from 'react';

const Hero: React.FC = () => {
  return (
    <section 
      id="home" 
      className="min-h-screen bg-cover bg-center bg-fixed flex justify-center items-center relative text-center"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=2070&auto=format&fit=crop')"
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      
      {/* Gradient bottom transition */}
      <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-black to-transparent z-0"></div>
      
      <h1 className="relative z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold px-5 text-shadow-lg">
        Create. Share. Inspire.
      </h1>
    </section>
  );
};

export default Hero;