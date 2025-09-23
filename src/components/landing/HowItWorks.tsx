"use client";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-[clamp(60px,10vh,100px)] px-[5%] bg-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[clamp(2rem,1.5rem+3vw,3rem)] mb-5">
          Create your video in 3 steps
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-16 leading-relaxed">
          From upload to final export, our process is designed to be intuitive and efficient.
        </p>

        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto">
          {/* Video Section */}
          <div className="flex-1 min-w-[300px] aspect-video rounded-xl overflow-hidden transition-all duration-300 shadow-2xl shadow-[rgba(176,48,94,0.3)]">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="https://res.cloudinary.com/dcpsgzkqo/video/upload/q_auto,f_auto/v1758641175/edicao2_ylyyqk.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Steps Section */}
          <div className="flex-1 flex flex-col gap-8">
            <div className="step-item">
              <h3 className="flex items-center gap-4 text-2xl mb-3">
                <span className="text-5xl font-bold text-white/20">01</span>
                Upload your content
              </h3>
              <p className="text-gray-400 leading-relaxed pl-16">
                Drag and drop your videos, audio, and images, or start with one of our professional templates.
              </p>
            </div>

            <div className="step-item">
              <h3 className="flex items-center gap-4 text-2xl mb-3">
                <span className="text-5xl font-bold text-white/20">02</span>
                Edit and customize
              </h3>
              <p className="text-gray-400 leading-relaxed pl-16">
                Use our intuitive timeline to cut, add text, effects, transitions, and more.
              </p>
            </div>

            <div className="step-item">
              <h3 className="flex items-center gap-4 text-2xl mb-3">
                <span className="text-5xl font-bold text-white/20">03</span>
                Export and share
              </h3>
              <p className="text-gray-400 leading-relaxed pl-16">
                Render your video in the cloud at high speed and share directly to your social media.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
