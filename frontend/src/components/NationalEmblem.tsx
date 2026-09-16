/**
 * CyberSuraksha - Official State Emblem of India
 * 
 * Official Lion Capital of Ashoka with Satyameva Jayate (सत्यमेव जयते)
 * and "Government of India" text as specified by institutional standards.
 */

"use client";

import React from "react";

interface EmblemProps {
  className?: string;
  color?: string;
  variant?: "dark" | "gold" | "original";
  alt?: string;
}

export function NationalEmblem({
  className = "w-10 h-12",
  variant = "dark",
  alt = "State Emblem of India - Government of India"
}: EmblemProps) {
  let src = "/emblem-dark.png";
  if (variant === "gold") {
    src = "/emblem-gold.png";
  } else if (variant === "original") {
    src = "/emblem.png";
  }

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
}

export function GovSealLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}>
      <img
        src="/emblem-dark.png"
        alt="Government of India Official Seal"
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export const NationalSSOLogo = GovSealLogo;
