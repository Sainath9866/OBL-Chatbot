import React, { useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

const AutoClickingButton = ({ tiles, handleNext }) => {
  useEffect(() => {
    // Set up the interval for auto-clicking
    const intervalId = setInterval(() => {
      if (tiles.length > 1) {
        handleNext();
      }
    }, 3000); // 3000ms = 3 seconds

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [handleNext, tiles.length]);

  return (
    <button 
      onClick={handleNext}
      className="absolute right-1 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
      disabled={tiles.length <= 1}
    >
      <ChevronRight className="w-6 h-6 text-gray-600" />
    </button>
  );
};

export default AutoClickingButton;