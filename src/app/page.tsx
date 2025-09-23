{
  /* eslint-disable react/no-unescaped-entities */
}
import type { Metadata } from "next";
import { Navigation } from "@/components/landing/Navigation";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { CTA } from "@/components/landing/CTA";

export const metadata: Metadata = {
  title: "Repurpose AI - Your content, reborn",
  description: "Transform your videos into engaging content with AI-powered editing tools, professional templates, and collaboration features.",
  keywords: "video editing, AI video editor, content creation, video repurposing, social media video",
};

export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <Navigation />
      <Hero />
      <Features />
      <div className="relative min-h-[50vh] flex items-center justify-center py-20 overflow-hidden bg-gradient-global">
        <h2 className="relative z-10 text-[clamp(2.5rem,2rem+2vw,4rem)] font-bold text-center px-5 text-shadow-lg">
          Simple. Fast. Online.
        </h2>
      </div>
      <HowItWorks />
      <div className="relative min-h-[50vh] flex items-center justify-center py-20 overflow-hidden bg-gradient-global">
        <h2 className="relative z-10 text-[clamp(2.5rem,2rem+2vw,4rem)] font-bold text-center px-5 text-shadow-lg">
          A plan for every creator.
        </h2>
      </div>
      <Pricing />
      <CTA />
      <footer className="bg-black py-10 px-[5%] text-center text-gray-400 border-t border-white/10">
        <p>&copy; 2025 Repurpose AI. All rights reserved.</p>
        <p className="mt-2">Repurpose AI - GDPR Compliance Policy</p>
      </footer>
    </main>
  );
}