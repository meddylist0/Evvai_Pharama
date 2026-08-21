import React from "react";

export const CoreCapabilitiesSection: React.FC = () => {
  return (
    <section id="capabilities" className="space-y-4 my-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Core Capabilities</h2>
        <p className="text-xs text-slate-500">Precision engineering across multiple dosage forms.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 - Solid Oral Dosage */}
        <div className="p-6 bg-white hover:bg-[#f4f4f6] border border-slate-200 hover:border-slate-300 rounded-2xl transition-all duration-300 hover:shadow-xs group cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-[#f4f4f6] group-hover:bg-[#0b2545] text-[#0b2545] group-hover:text-white flex items-center justify-center mb-4 transition-all duration-300 shadow-2xs">
            {/* Pill Capsule Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10.5 6a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 0 0 7 0v-5A3.5 3.5 0 0 0 10.5 6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M7 11.5h7" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Solid Oral Dosage</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            High-volume tablet compression and specialized film coating technologies.
          </p>
        </div>

        {/* Card 2 - Encapsulation */}
        <div className="p-6 bg-white hover:bg-[#f4f4f6] border border-slate-200 hover:border-slate-300 rounded-2xl transition-all duration-300 hover:shadow-xs group cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-[#f4f4f6] group-hover:bg-[#0b2545] text-[#0b2545] group-hover:text-white flex items-center justify-center mb-4 transition-all duration-300 shadow-2xs">
            {/* Gelatin Capsule / Jar Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Encapsulation</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Precision hard gelatin and HPMC capsule filling with integrated weight checking.
          </p>
        </div>

        {/* Card 3 - Liquid Orals */}
        <div className="p-6 bg-white hover:bg-[#f4f4f6] border border-slate-200 hover:border-slate-300 rounded-2xl transition-all duration-300 hover:shadow-xs group cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-[#f4f4f6] group-hover:bg-[#0b2545] text-[#0b2545] group-hover:text-white flex items-center justify-center mb-4 transition-all duration-300 shadow-2xs">
            {/* Droplet Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Liquid Orals</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Automated compounding and bottling lines for syrups and suspensions.
          </p>
        </div>

        {/* Card 4 - Sterile Injectables */}
        <div className="p-6 bg-white hover:bg-[#f4f4f6] border border-slate-200 hover:border-slate-300 rounded-2xl transition-all duration-300 hover:shadow-xs group cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-[#f4f4f6] group-hover:bg-[#0b2545] text-[#0b2545] group-hover:text-white flex items-center justify-center mb-4 transition-all duration-300 shadow-2xs">
            {/* Syringe and Vial Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11l-8-8-8 8m8-8v16" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19h14" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Sterile Injectables</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Aseptic filling environments for vials and ampoules meeting stringent global standards.
          </p>
        </div>
      </div>
    </section>
  );
};
