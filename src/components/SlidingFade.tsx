'use client';

import { ReactNode, useEffect, useState } from 'react';

interface SlidingFadeProps {
  children: ReactNode;
  isVisible: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  className?: string;
}

export default function SlidingFade({ 
  children, 
  isVisible, 
  direction = 'left', 
  duration = 300,
  className = ''
}: SlidingFadeProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  if (!shouldRender) return null;

  const getTransformClasses = () => {
    switch (direction) {
      case 'left':
        return isVisible 
          ? 'translate-x-0 opacity-100' 
          : '-translate-x-8 opacity-0';
      case 'right':
        return isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-8 opacity-0';
      case 'up':
        return isVisible 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-8 opacity-0';
      case 'down':
        return isVisible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-8 opacity-0';
      default:
        return isVisible 
          ? 'translate-x-0 opacity-100' 
          : '-translate-x-8 opacity-0';
    }
  };

  return (
    <div 
      className={`transition-all duration-300 ease-in-out ${getTransformClasses()} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
