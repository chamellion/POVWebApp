'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function SafeImage({ 
  src, 
  alt, 
  width = 400, 
  height = 192, 
  className = '', 
  style = {} 
}: SafeImageProps) {
  const [useFallback, setUseFallback] = useState(false);

  // If fallback is needed or src is empty, use regular img tag
  if (useFallback || !src) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        onError={() => {
          // If img also fails, show placeholder
          console.warn(`Failed to load image: ${src}`);
        }}
      />
    );
  }

  // Try Next.js Image first
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      onError={() => {
        // Fall back to regular img tag if Next.js Image fails
        setUseFallback(true);
      }}
    />
  );
}
