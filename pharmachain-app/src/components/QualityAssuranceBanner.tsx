import React from "react";

export const QualityAssuranceBanner: React.FC = () => {
  return (
    <section id="quality" className="bg-[#1e293b] rounded-xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 my-10 shadow-xs">
      <div className="max-w-xl space-y-2">
        <h3 className="text-lg md:text-xl font-bold tracking-tight">Uncompromising Quality Assurance</h3>
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          Our facilities operate under the strictest international guidelines. Every batch undergoes rigorous QA/QC analytical testing in our state-of-the-art laboratories before release.
        </p>
      </div>

      {/* Badges matching Stitch screenshot */}
      <div className="flex items-center space-x-3 w-full md:w-auto justify-start md:justify-end">
        <div className="bg-[#0f172a] border border-[#334155] w-20 h-20 rounded-xl flex flex-col items-center justify-center p-2 text-center hover:border-[#38bdf8] transition-colors cursor-pointer">
          <svg className="w-5 h-5 text-emerald-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">WHO-GMP</span>
        </div>

        <div className="bg-[#0f172a] border border-[#334155] w-20 h-20 rounded-xl flex flex-col items-center justify-center p-2 text-center hover:border-[#38bdf8] transition-colors cursor-pointer">
          <svg className="w-5 h-5 text-teal-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">ISO 9001</span>
        </div>

        <div className="bg-[#0f172a] border border-[#334155] w-20 h-20 rounded-xl flex flex-col items-center justify-center p-2 text-center hover:border-[#38bdf8] transition-colors cursor-pointer">
          <svg className="w-5 h-5 text-sky-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.072a2 2 0 00-1.874 1.258l-.19.476a2 2 0 001.258 2.531l2.387.955a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.955a2 2 0 002.531-1.258l.19-.476z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">GLP Lab</span>
        </div>
      </div>
    </section>
  );
};
