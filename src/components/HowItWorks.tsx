import React from 'react';

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ number, title, description }) => (
  <div className="bg-gray-900 p-8 rounded-xl border border-white/10 text-left">
    <div className="text-5xl font-bold text-white/10 mb-3">{number}</div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

const ParallaxSection: React.FC = () => (
  <section 
    id="how-it-works" 
    className="min-h-screen bg-cover bg-center bg-fixed flex justify-center items-center relative text-center"
    style={{
      backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')"
    }}
  >
    <div className="absolute inset-0 bg-black/60 z-0"></div>
    <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-black to-transparent z-0"></div>
    
    <h1 className="relative z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold px-5 text-shadow-lg">
      Simple. Fast. Powerful.
    </h1>
  </section>
);

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: "01",
      title: "Upload your media",
      description: "Upload your media to start creating your videos."
    },
    {
      number: "02", 
      title: "Edit with ease",
      description: "Edit your media with ease using our intuitive interface."
    },
    {
      number: "03",
      title: "Export and share", 
      description: "Render your videos and share them with your social media and friends."
    }
  ];

  return (
    <>
      <ParallaxSection />
      
      <section className="py-16 lg:py-24 px-[5%] bg-black text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">
          Create your videos in minutes.
        </h2>
        <p className="text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-16 text-gray-300">
          From uploading to sharing, our platform makes video creation simple and efficient.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default HowItWorks;