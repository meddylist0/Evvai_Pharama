"use client";

import React, { useState } from "react";

export const ContractManufacturingSection: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    dosageForm: "Solid Oral Tablets",
    quantity: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contract-manufacturing" className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-3xl p-8 md:p-12 my-10 space-y-8 shadow-2xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column Text */}
        <div className="lg:col-span-6 space-y-4">
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200">
            Custom Formulations & Private Labeling
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#0b2341] tracking-tight leading-tight">
            Third-Party & Contract Manufacturing Services
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-normal">
            Partner with EVVAI Pharmaceuticals for end-to-end custom formulation development, cleanroom filling, batch packing, and regulatory documentation under WHO-GMP certified standards.
          </p>

          <div className="space-y-3 pt-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">✓</div>
              <span>Zero-Defect Automated Cleanroom Filling & Packaging</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">✓</div>
              <span>COA, Stability Data & Complete Regulatory Dossier Support</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">✓</div>
              <span>Flexible Minimum Batch Sizes for Specialized Molecules</span>
            </div>
          </div>
        </div>

        {/* Right Column Inquiry Form */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center text-xl font-bold">
                ✓
              </div>
              <h3 className="text-lg font-bold text-[#0b2341]">Enquiry Submitted Successfully</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Our Contract Manufacturing Technical Team will review your formulation requirement and contact you within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-xs font-bold text-[#0b2341] hover:underline pt-2 inline-block"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs" suppressHydrationWarning>
              <h3 className="text-sm font-bold text-[#0b2341] border-b border-slate-100 pb-2">
                Request Contract Manufacturing Quote
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Apex Pharma Labs"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Dr. Rajesh"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rajesh@apex.com"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage Form</label>
                  <select
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                    suppressHydrationWarning
                  >
                    <option>Solid Oral Tablets</option>
                    <option>Hard Gelatin Capsules</option>
                    <option>Liquid Syrups / Orals</option>
                    <option>Sterile Injectable Vials</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Quantity</label>
                  <input
                    type="text"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="50,000 Packs"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white py-3 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer mt-2"
                suppressHydrationWarning
              >
                Submit Contract Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
