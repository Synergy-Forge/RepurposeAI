"use client";

import { useEffect, useRef } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-[rgba(17,17,17,0.8)] p-8 rounded-xl border border-white/10 text-left hover:transform hover:-translate-y-2 transition-transform duration-300">
      <div className="w-12 h-12 text-white">{icon}</div>
      <h3 className="text-2xl font-medium mt-4 mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

export function Features() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);

  return (
    <section id="features" className="relative py-[clamp(60px,10vh,100px)] px-[5%] overflow-hidden">
      {/* Background video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-1/2 left-1/2 w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 z-0"
      >
        <source src="https://res.cloudinary.com/dcpsgzkqo/video/upload/q_auto,f_auto/v1758641187/galaxy_ejmpcf.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto">
        <h2 className="text-[clamp(2rem,1.5rem+3vw,3rem)] mb-5">
          Powerful tools, professional results
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-16 leading-relaxed">
          Everything you need to create standout videos, powered by our cutting-edge technology.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"></path><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path></svg>}
            title="AI-Powered Smart Editing"
            description="Our AI suggests cuts, transitions, and even soundtracks to make your video more dynamic and professional."
          />
          <FeatureCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
            title="Resource Library"
            description="Access millions of licensed videos, images, and music tracks to use in your projects worry-free."
          />
          <FeatureCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>}
            title="Ready-Made Templates"
            description="Get started quickly with professional templates for social media, ads, vlogs, and more."
          />
          <FeatureCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
            title="Real-Time Collaboration"
            description="Invite your team to edit projects together, with comments and approvals all in one place."
          />
          <FeatureCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>}
            title="Analytics & Metrics"
            description="Track your videos' performance with detailed viewing and engagement metrics."
          />
        </div>
      </div>
    </section>
  );
}

export default Features;
