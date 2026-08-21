import React from "react";

export const HeroSection: React.FC = () => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-2">
      {/* Hero Left Card matching exact design screenshot (#f7f6f4 warm porcelain tint) */}
      <div className="lg:col-span-7 bg-[#f7f6f4] border border-[#e8e6e2] rounded-[24px] p-8 md:p-12 flex flex-col justify-between shadow-2xs">
        <div>
          {/* WHO-GMP Certified Pill Badge */}
          <div className="inline-flex items-center space-x-2 bg-[#e6ebd9] text-[#28572a] border border-[#c6d7bb] px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide mb-6">
            <svg className="w-3.5 h-3.5 text-[#28572a]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>WHO-GMP Certified Facility</span>
          </div>

          {/* Hero Main Headline matching exact screenshot typography & colors */}
          <h1 className="text-3xl md:text-5xl font-bold text-[#0b2341] leading-[1.14] tracking-tight mb-5 font-sans">
            Your Cure is Our<br />
            Medicine.<br />
            <span className="text-[#3865b0]">Trusted Healthcare</span><br />
            <span className="text-[#3865b0]">Solutions.</span>
          </h1>

          {/* Hero Body Copy */}
          <p className="text-[#576375] text-sm md:text-base leading-relaxed max-w-xl mb-8 font-normal">
            Delivering trusted medicines with uncompromised quality. Committed to better health and patient care. Access a wide range of safe and effective healthcare solutions.
          </p>
        </div>

        {/* Action Buttons matching Stitch pill buttons */}
        <div className="flex flex-wrap gap-4">
          <a
            href="/catalog"
            className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-3 rounded-lg text-xs font-bold transition-all shadow-xs inline-block"
          >
            Explore Products
          </a>
          <a
            href="/contact"
            className="bg-[#f7f6f4] hover:bg-white border border-[#0b2341]/25 text-[#0b2341] px-6 py-3 rounded-lg text-xs font-bold transition-all inline-block shadow-2xs"
          >
            Contact Us
          </a>
        </div>
      </div>

      {/* Hero Right Image Box using exact high-res cleanroom asset matching screenshot */}
      <div className="lg:col-span-5 relative rounded-[24px] overflow-hidden min-h-[380px] lg:min-h-[440px] border border-slate-200/80 shadow-2xs">
        <img
          src="/pharma_cleanroom_hero.jpg"
          alt="Pharmaceutical Automated Cleanroom Bottling Facility"
          className="w-full h-full object-cover rounded-[24px] hover:scale-102 transition-transform duration-500"
        />
      </div>
    </section>
  );
};
