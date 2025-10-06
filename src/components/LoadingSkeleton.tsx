'use client';

import { useDarkMode } from '@/contexts/DarkModeContext';

interface SkeletonProps {
  className?: string;
  isDarkMode?: boolean;
}

export function Skeleton({ className = '', isDarkMode }: SkeletonProps) {
  const { isDarkMode: contextDarkMode } = useDarkMode();
  const darkMode = isDarkMode ?? contextDarkMode;
  
  return (
    <div className={`animate-pulse rounded ${
      darkMode 
        ? 'bg-gray-700/50' 
        : 'bg-gray-200/50'
    } ${className}`} />
  );
}

export function CardSkeleton() {
  const { isDarkMode } = useDarkMode();
  
  return (
    <div className={`backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800/60 border-gray-700' 
        : 'bg-white/90 border-white/20'
    }`}>
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}

export function ButtonSkeleton() {
  const { isDarkMode } = useDarkMode();
  
  return (
    <Skeleton 
      className={`h-12 w-32 rounded-xl ${
        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'
      }`} 
    />
  );
}

export function ReceiptCardSkeleton() {
  const { isDarkMode } = useDarkMode();
  
  return (
    <div className={`border rounded-lg p-4 shadow-sm transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600' 
        : 'bg-gradient-to-r from-white to-gray-50 border-gray-200'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

export function UploadAreaSkeleton() {
  const { isDarkMode } = useDarkMode();
  
  return (
    <div className={`backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gray-800/60 border-gray-700' 
        : 'bg-white/80 border-white/20'
    }`}>
      <div className={`border-2 border-dashed rounded-2xl p-12 text-center ${
        isDarkMode 
          ? 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-700/50' 
          : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100'
      }`}>
        <Skeleton className="h-16 w-16 rounded-full mx-auto mb-6" />
        <Skeleton className="h-8 w-64 mx-auto mb-3" />
        <Skeleton className="h-6 w-80 mx-auto mb-8" />
        <Skeleton className="h-12 w-48 mx-auto rounded-xl" />
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="text-center">
          <Skeleton className="h-12 w-80 mx-auto mb-3" />
          <Skeleton className="h-1 w-24 mx-auto rounded-full" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <Skeleton className="h-6 w-96 mx-auto" />
    </div>
  );
}
