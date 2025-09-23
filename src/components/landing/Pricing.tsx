"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Up to 5 videos per month",
      "720p video quality",
      "Basic templates",
      "2GB storage",
      "Community support"
    ],
    cta: "Start Now"
  },
  {
    name: "Creator",
    price: "$12",
    period: "per month",
    features: [
      "Unlimited videos",
      "1080p video quality",
      "All templates",
      "20GB storage",
      "Priority support",
      "No watermark",
      "Custom branding"
    ],
    cta: "Choose Creator"
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    features: [
      "Everything in Creator",
      "4K video quality",
      "100GB storage",
      "API access",
      "Custom templates",
      "Advanced analytics",
      "Dedicated support"
    ],
    cta: "Choose Pro",
    featured: true
  },
  {
    name: "Producer",
    price: "$99",
    period: "per month",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "White-label solution",
      "Multiple team seats",
      "Custom integrations",
      "24/7 phone support",
      "Account manager"
    ],
    cta: "Contact Sales"
  }
];

function CheckIcon() {
  return (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

export function Pricing() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <section id="pricing" className="py-[clamp(60px,10vh,100px)] px-[5%] bg-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[clamp(2rem,1.5rem+3vw,3rem)] mb-5">
          Find your perfect plan
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-16 leading-relaxed">
          Start free and scale as your creativity grows. No commitments.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col ${
                tier.featured
                  ? "bg-white text-black scale-105 z-10"
                  : "bg-[rgba(17,17,17,0.8)] text-white"
              } p-8 rounded-xl border border-white/10 hover:transform hover:-translate-y-2 transition-all duration-300`}
            >
              <div className="flex-grow">
                <h3 className="text-2xl font-bold mb-4">{tier.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">{tier.price}</span>
                  <span className={`text-sm ${tier.featured ? "text-gray-600" : "text-gray-400"}`}>
                    /{tier.period}
                  </span>
                </div>
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className={`block w-full py-4 px-6 rounded-lg text-center font-medium transition-colors ${
                  tier.featured
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-[#222] text-white border border-[#444] hover:bg-[#333]"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
