"use client";

import { useEffect, useState } from "react";

export function Hero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="home"
      className="relative flex justify-center items-center min-h-screen py-40 text-center"
      style={{
        backgroundAttachment: "fixed",
        transform: `translateY(${scrollY * 0.5}px)`,
      }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black"></div>

      {/* Content */}
      <h1 className="relative z-10 text-[clamp(3rem,2rem+4vw,5rem)] font-bold px-5 text-shadow-lg">
        Your content,{" "}
        <span className="font-bold text-[#f7e1b5] inline-block animate-fire">
          reborn
        </span>
        .
      </h1>
    </section>
  );
}

export default Hero;
