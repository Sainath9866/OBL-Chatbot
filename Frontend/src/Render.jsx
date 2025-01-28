import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

const SuggestedOptionsViewer = ({ suggested_options, setCurrentAction }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [displayedOptions, setDisplayedOptions] = useState([]);
  const [showViewMore, setShowViewMore] = useState(false);
  const componentRef = useRef(null);
  const wheelTimer = useRef(null);

  // Initialize displayed options
  useEffect(() => {
    if (suggested_options.length > 0) {
      const initialOptions = suggested_options.slice(0, ITEMS_PER_PAGE);
      setDisplayedOptions(initialOptions);
      setShowViewMore(suggested_options.length > ITEMS_PER_PAGE);
    }
  }, [suggested_options]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (componentRef.current) {
      observer.observe(componentRef.current);
    }

    return () => {
      if (componentRef.current) {
        observer.unobserve(componentRef.current);
      }
    };
  }, []);

  const handleWheel = (e) => {
    e.preventDefault();

    if (wheelTimer.current) {
      clearTimeout(wheelTimer.current);
    }

    wheelTimer.current = setTimeout(() => {
      const sensitivity = 50;
      
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (e.deltaX > sensitivity && currentIndex < displayedOptions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setIsPlaying(false);
        } else if (e.deltaX < -sensitivity && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setIsPlaying(false);
        }
      }
    }, 50);
  };

  // Auto-play effect
  useEffect(() => {
    let intervalId;
    
    if (isPlaying && displayedOptions.length > 1 && isVisible) {
      intervalId = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev === displayedOptions.length - 1) {
            if (showViewMore) {
              return prev;
            }
            return 0;
          }
          return prev + 1;
        });
      }, 5000);
    }

    return () => clearInterval(intervalId);
  }, [isPlaying, displayedOptions.length, isVisible, showViewMore]);

  // Clean up wheel timer
  useEffect(() => {
    return () => {
      if (wheelTimer.current) {
        clearTimeout(wheelTimer.current);
      }
    };
  }, []);

  const handleLoadMore = () => {
    const currentLength = displayedOptions.length;
    const nextBatch = suggested_options.slice(currentLength, currentLength + ITEMS_PER_PAGE);
    setDisplayedOptions([...displayedOptions, ...nextBatch]);
    setShowViewMore(currentLength + ITEMS_PER_PAGE < suggested_options.length);
  };

  const currentOption = displayedOptions[currentIndex];

  if (!displayedOptions.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-3 max-w-md">
        <div className="text-sm font-medium mb-2">
          No items found
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={componentRef} 
      className="bg-white rounded-lg shadow-lg p-3 max-w-md"
      onWheel={handleWheel}
    >
      <div className="text-sm font-medium mb-2">
        Showing {displayedOptions.length} of {suggested_options.length} items 🎯
      </div>

      <div className="relative">
        <div className="relative aspect-[4/3] mb-2">
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div 
              className="absolute w-full h-full transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              <div className="flex">
                {displayedOptions.map((option, index) => (
                  <div 
                    key={index}
                    className="w-full h-full flex-shrink-0"
                    style={{ aspectRatio: '4/3' }}
                  >
                    <img
                      src={option.image_url}
                      alt={option.label}
                      className="w-full h-full object-cover"
                      draggable="false"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(prev => prev - 1);
                  setIsPlaying(false);
                }
              }}
              className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-1.5 transition-opacity pointer-events-auto"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => {
                if (currentIndex < displayedOptions.length - 1) {
                  setCurrentIndex(prev => prev + 1);
                  setIsPlaying(false);
                }
              }}
              className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-1.5 transition-opacity pointer-events-auto"
              disabled={currentIndex === displayedOptions.length - 1}
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Counter and Play/Pause */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-between items-center px-2">
            <div className="text-xs text-white bg-black bg-opacity-50 px-2 py-0.5 rounded">
              {currentIndex + 1}/{displayedOptions.length}
            </div>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white bg-black bg-opacity-50 p-1.5 rounded-full hover:bg-opacity-70"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
        </div>

        {/* View More Button */}
        {showViewMore && currentIndex === displayedOptions.length - 1 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 absolute inset-0 rounded-lg" />
            <button
              onClick={handleLoadMore}
              className="relative z-10 bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50"
            >
              View More ({suggested_options.length - displayedOptions.length} remaining)
            </button>
          </div>
        )}

        {/* Info Section */}
        {currentOption && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-baseline">
              <h2 className="font-bold">{currentOption.name}</h2>
              <p className="font-bold">₹{currentOption.price}/sq.ft</p>
            </div>
            
            <div className="justify-between text-sm">
              <span className="font-bold">Size : </span>
              <span className="font-semibold">{currentOption.size}</span>
              
              <span className="font-bold">    Finish : </span>
              <span className="font-semibold">{currentOption.finish}</span>
            </div>

            <div className="text-sm">
              <span className="font-bold">Material: </span>
              <span className="font-semibold">{currentOption.material}</span>
              <div className="font-bold">Applicable for: </div>
              <div className="font-semibold">{currentOption.applications}</div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                className="flex-1 bg-white border border-green-600 text-green-600 py-1 px-2 rounded text-xs hover:bg-green-50"
                onClick={() => window.open(currentOption.product_url, '_blank')}
              >
                See Details / Buy Now
              </button>
              <button
                onClick={() => setCurrentAction('SHOW_TILES')}
                className="flex-1 bg-white border border-green-600 text-green-600 py-1 px-2 rounded text-xs hover:bg-green-50"
              >
                Change Category
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedOptionsViewer;