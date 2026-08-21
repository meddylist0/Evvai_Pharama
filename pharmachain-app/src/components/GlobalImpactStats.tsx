import React from "react";

export const GlobalImpactStats: React.FC = () => {
  const stats = [
    { label: "Global Export Nations", value: "50+", desc: "Supplying WHO-GMP formulations globally" },
    { label: "Annual Doses Produced", value: "500M+", desc: "High-speed automated cleanroom capacity" },
    { label: "Quality Compliance", value: "100%", desc: "WHO-GMP & ISO 9001:2015 Accredited" },
    { label: "Batch Delivery Rate", value: "99.8%", desc: "Cold-chain integrated distribution" },
  ];

  return (
    <section className="bg-[#0b2341] text-white rounded-3xl p-8 md:p-10 my-8 shadow-sm">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-700/60">
        {stats.map((stat, idx) => (
          <div key={idx} className={`space-y-1 ${idx > 0 ? "pt-4 lg:pt-0 lg:pl-6" : ""}`}>
            <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight block">
              {stat.value}
            </span>
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider block">
              {stat.label}
            </h4>
            <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
              {stat.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
