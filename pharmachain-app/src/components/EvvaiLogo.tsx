import React from "react";

interface EvvaiLogoProps {
  className?: string;
  variant?: "dark" | "light"; // "dark" logo for white backgrounds, "light" logo for dark backgrounds
  alt?: string;
}

export const EvvaiLogo: React.FC<EvvaiLogoProps> = ({
  className = "h-11 w-auto",
  variant = "dark",
  alt = "EVVAI PHARMACEUTICALS - Your Cure is our Medicine",
}) => {
  const logoSrc = variant === "light" ? "/images/evvai_logo_light.png" : "/images/evvai_logo_dark.png";

  return (
    <div className="flex items-center select-none">
      <img
        src={logoSrc}
        alt={alt}
        className={`${className} object-contain transition-transform duration-200`}
        loading="eager"
      />
    </div>
  );
};
