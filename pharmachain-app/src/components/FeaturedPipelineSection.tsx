import React from "react";
import Link from "next/link";

interface ProductCardProps {
  name: string;
  subtitle: string;
  composition: string;
  packSize: string;
  image: string;
}

export const FeaturedPipelineSection: React.FC = () => {
  const products: ProductCardProps[] = [
    {
      name: "Zene Melatonin Oral Spray",
      subtitle: "Convenient mint-flavoured sublingual spray designed to support your bedtime routine.",
      composition: "Melatonin Oral Formulation",
      packSize: "30ml Sublingual Spray",
      image: "/images/product_zene.png",
    },
    {
      name: "NXTNERve B12 Injection",
      subtitle: "Mecobalamin 1500 mcg injection formulated to support nerve health & neuropathy.",
      composition: "Mecobalamin 1500mcg / 2ml",
      packSize: "5 × 2ml Ampoules",
      image: "/images/product_nxtnerve.png",
    },
    {
      name: "NXTLife-600 Glutathione",
      subtitle: "Potent cellular antioxidant & skin radiance tablets with Vitamin C.",
      composition: "L-Glutathione 600mg + Vitamin C 100mg",
      packSize: "30 Tablets Bottle",
      image: "/images/product_nxtlife.jpg",
    },
  ];

  return (
    <section id="catalog" className="space-y-4 my-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Featured Pipeline</h2>
          <p className="text-xs text-slate-500">High-demand generic and specialized formulations.</p>
        </div>
        <Link href="/catalog" className="text-xs font-bold text-[#0b2545] hover:text-blue-700 transition-colors">
          View Full Catalog &rarr;
        </Link>
      </div>

      {/* 3-Card Product Grid matching Stitch mockup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((prod, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all group"
          >
            {/* Image Box */}
            <div className="h-48 overflow-hidden bg-white relative p-4 flex items-center justify-center border-b border-slate-100 group-hover:bg-slate-50/50 transition-colors">
              <img
                src={prod.image}
                alt={prod.name}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-xs"
              />
            </div>

            {/* Product Card Text */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{prod.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{prod.subtitle}</p>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-normal">Composition</span>
                  <span className="font-semibold text-slate-800">{prod.composition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-normal">Pack Size</span>
                  <span className="font-semibold text-slate-800">{prod.packSize}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
