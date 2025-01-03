import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AnimatedTileViewer = ({ tiles, currentIndex, handleNext, handlePrevious, setCurrentAction }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const currentTile = tiles[currentIndex];

  const handleNextWithAnimation = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection('slide-left');
    
    setTimeout(() => {
      handleNext();
      setSlideDirection('');
      setIsAnimating(false);
    }, 300);
  };

  const handlePreviousWithAnimation = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection('slide-right');
    
    setTimeout(() => {
      handlePrevious();
      setSlideDirection('');
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="text-l font-semibold mb-4">
        Voila! Your search has uncovered {tiles.length} item(s) that perfectly match your criteria. 🎯
      </div>
      
      <div className="relative overflow-hidden">
        <div className={`transform transition-all duration-300 ease-in-out ${
          
          slideDirection === 'slide-right' ? 'translate-x-full' : 
          'translate-x-0'
        }`}>
          {/* Entire Tile Content Wrapper */}
          <div className="w-full">
            {/* Image Container */}
            <div className="relative aspect-[4/3] mb-4">
              <img
                src={currentTile.image_path}
                alt={currentTile.name}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute bottom-2 left-2 text-sm text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {currentIndex + 1}/{tiles.length}
              </div>
            </div>

            {/* Details Container */}
            <div className="space-y-2">
              <h2 className="text-md font-semibold">{currentTile.name}</h2>
              <p className="text-md font-bold">MRP/SQ.FT: INR {currentTile.price}</p>
              <p className="text-gray-600">Size: {currentTile.size}</p>
              
              <div className="flex gap-2 mt-4">
                <a
                  href={currentTile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-white border border-green-600 text-green-600 py-2 px-4 rounded-lg text-center hover:bg-green-50 transition-colors"
                >
                  See Details
                </a>
                <button
                  onClick={() => setCurrentAction('SHOW_TILES')}
                  className="flex-1 bg-white border border-green-600 text-green-600 py-2 px-4 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Change Category
                </button>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handlePreviousWithAnimation}
          className="absolute left-1 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed z-10"
          disabled={tiles.length <= 1 || isAnimating}
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <AutoClickingButton 
          tiles={tiles} 
          handleNext={handleNextWithAnimation}
          disabled={isAnimating}
        />
      </div>
    </div>
  );
};

const AutoClickingButton = ({ tiles, handleNext, disabled }) => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (tiles.length > 1 && !disabled) {
        handleNext();
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [handleNext, tiles.length, disabled]);

  return (
    <button 
      onClick={handleNext}
      className="absolute right-1 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed z-10"
      disabled={tiles.length <= 1 || disabled}
    >
      <ChevronRight className="w-6 h-6 text-gray-600" />
    </button>
  );
};

export default AnimatedTileViewer;