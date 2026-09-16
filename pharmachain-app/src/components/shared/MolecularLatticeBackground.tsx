import React from "react";

export const MolecularLatticeBackground: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <svg
        className="w-full h-full opacity-40 text-[#0284C7]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          {/* Chemical Molecular Hexagon Lattice Pattern - High-Clarity Crisp Lines */}
          <pattern
            id="molecular-lattice"
            width="120"
            height="104"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1)"
          >
            {/* Hexagon 1 */}
            <path
              d="M30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 L0 17.32 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeOpacity="0.3"
            />
            {/* Connected Molecular Node Dots */}
            <circle cx="30" cy="0" r="2.5" fill="currentColor" fillOpacity="0.4" />
            <circle cx="60" cy="17.32" r="2.5" fill="currentColor" fillOpacity="0.4" />
            <circle cx="60" cy="51.96" r="2.5" fill="currentColor" fillOpacity="0.4" />
            <circle cx="30" cy="69.28" r="2.5" fill="currentColor" fillOpacity="0.4" />

            {/* Hexagon 2 Offset */}
            <path
              d="M90 52 L120 69.32 L120 103.96 L90 121.28 L60 103.96 L60 69.32 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeOpacity="0.25"
            />
            {/* Interconnecting bonds */}
            <line x1="60" y1="17.32" x2="90" y2="0" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.2" />
            <line x1="60" y1="51.96" x2="90" y2="52" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.2" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#molecular-lattice)" />
      </svg>
    </div>
  );
};
