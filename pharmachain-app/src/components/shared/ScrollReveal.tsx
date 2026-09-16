"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number; // Milliseconds delay
  direction?: "up" | "down" | "left" | "right" | "zoom";
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  direction = "up",
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Optionally unobserve after revealing once
            if (domRef.current) observer.unobserve(domRef.current);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible in viewport
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before it hits bottom of viewport
      }
    );

    const { current } = domRef;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  const getInitialTransform = () => {
    switch (direction) {
      case "up":
        return "translate-y-10 opacity-0";
      case "down":
        return "-translate-y-10 opacity-0";
      case "left":
        return "translate-x-10 opacity-0";
      case "right":
        return "-translate-x-10 opacity-0";
      case "zoom":
        return "scale-95 opacity-0";
      default:
        return "translate-y-10 opacity-0";
    }
  };

  return (
    <div
      ref={domRef}
      suppressHydrationWarning
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${
        isVisible ? "translate-y-0 translate-x-0 scale-100 opacity-100" : getInitialTransform()
      } ${className}`}
    >
      {children}
    </div>
  );
};
