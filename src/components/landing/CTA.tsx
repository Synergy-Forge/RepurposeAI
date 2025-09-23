"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function CTA() {
  const { status } = useSession();

  return (
    <section className="relative min-h-[50vh] flex items-center justify-center py-20 overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-global opacity-90"></div>

      {/* Content */}
      <div className="relative z-10 text-center px-5">
        <h2 className="text-[clamp(2.5rem,2rem+2vw,4rem)] font-bold mb-8 text-shadow-lg">
          Ready to create videos that impress?
        </h2>
        <Link
          href={status === "authenticated" ? "/dashboard" : "/register"}
          className="inline-block px-8 py-4 text-xl font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
        >
          Start creating for free
        </Link>
      </div>
    </section>
  );
}

export default CTA;
