import React from 'react';

const LoadingSpinner = ({ size = 'md', text, fullScreen = false }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${fullScreen ? 'min-h-[60vh]' : 'py-12'}`}>
      <div className={`${sizes[size] || sizes.md} border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
