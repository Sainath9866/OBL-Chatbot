import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

const AnimatedTileViewer = ({ tiles = [], setCurrentAction }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [displayedTiles, setDisplayedTiles] = useState([]);
  const [showViewMore, setShowViewMore] = useState(false);
  const componentRef = useRef(null);
  const wheelTimer = useRef(null);

  // Initialize displayed tiles
  useEffect(() => {
    if (tiles.length > 0) {
      const initialTiles = tiles.slice(0, ITEMS_PER_PAGE);
      setDisplayedTiles(initialTiles);
      setShowViewMore(tiles.length > ITEMS_PER_PAGE);
    }
  }, [tiles]);

  // Intersection Observer effect
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

  // Auto-play effect
  useEffect(() => {
    let intervalId;
    
    if (isPlaying && displayedTiles.length > 1 && isVisible) {
      intervalId = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev === displayedTiles.length - 1) {
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
  }, [isPlaying, displayedTiles.length, isVisible, showViewMore]);

  useEffect(() => {
    return () => {
      if (wheelTimer.current) {
        clearTimeout(wheelTimer.current);
      }
    };
  }, []);

  const handleLoadMore = () => {
    const currentLength = displayedTiles.length;
    const nextBatch = tiles.slice(currentLength, currentLength + ITEMS_PER_PAGE);
    setDisplayedTiles([...displayedTiles, ...nextBatch]);
    setShowViewMore(currentLength + ITEMS_PER_PAGE < tiles.length);
  };

  const handleWheel = (e) => {
    e.preventDefault();

    if (wheelTimer.current) {
      clearTimeout(wheelTimer.current);
    }

    wheelTimer.current = setTimeout(() => {
      const sensitivity = 50;
      
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (e.deltaX > sensitivity && currentIndex < displayedTiles.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setIsPlaying(false);
        } else if (e.deltaX < -sensitivity && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setIsPlaying(false);
        }
      }
    }, 50);
  };

  const currentTile = displayedTiles[currentIndex];

  if (!displayedTiles.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-2 max-w-md">
        <div className="text-xs font-medium">
          No items found
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={componentRef} 
      className="bg-white rounded-lg shadow-lg p-2 max-w-md"
      onWheel={handleWheel}
    >
      <div className="text-xs font-medium">
        Showing {displayedTiles.length} of {tiles.length} items 🎯
      </div>

      <div className="relative">
        {/* Image Viewer */}
        <div className="relative aspect-[16/9] my-1">
          {/* Image Container */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div 
              className="absolute w-full h-full transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`
              }}
            >
              <div className="flex">
                {displayedTiles.map((tile, index) => (
                  <div 
                    key={index}
                    className="w-full h-full flex-shrink-0"
                    style={{ aspectRatio: '16/9' }}
                  >
                    <img
                      src={tile.image_url}
                      alt={tile.name}
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
              className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-1 transition-opacity pointer-events-auto"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-3 h-3 text-white" />
            </button>
            <button
              onClick={() => {
                if (currentIndex < displayedTiles.length - 1) {
                  setCurrentIndex(prev => prev + 1);
                  setIsPlaying(false);
                }
              }}
              className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-1 transition-opacity pointer-events-auto"
              disabled={currentIndex === displayedTiles.length - 1}
            >
              <ChevronRight className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* Counter and Play/Pause */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-between items-center px-2">
            <div className="text-xs text-white bg-black bg-opacity-50 px-1.5 py-0.5 rounded">
              {currentIndex + 1}/{displayedTiles.length}
            </div>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white bg-black bg-opacity-50 p-1 rounded-full hover:bg-opacity-70"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
          </div>
        </div>

        {/* View More Button */}
        {showViewMore && currentIndex === displayedTiles.length - 1 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 absolute inset-0 rounded-lg" />
            <button
              onClick={handleLoadMore}
              className="relative z-10 bg-white text-green-600 px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-50"
            >
              View More ({tiles.length - displayedTiles.length} remaining)
            </button>
          </div>
        )}

        {/* Info Section */}
        {currentTile && (
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between items-baseline">
              <h2 className="font-bold">{currentTile.name}</h2>
              <p className="font-bold">₹{currentTile.price}/sq.ft</p>
            </div>
            
            <div className="justify-between">
              <span className="font-bold">Size: </span>
              <span className="font-semibold">{currentTile.size}</span>
              
              <span className="font-bold ml-2">Finish: </span>
              <span className="font-semibold">{currentTile.finish}</span>
            </div>

            <div>
              <span className="font-bold">Material: </span>
              <span className="font-semibold">{currentTile.material}</span>
              <div className="font-bold">Applicable for: </div>
              <div className="font-semibold">{currentTile.applications}</div>
            </div>

            <div className="flex gap-2 mt-1">
              <button
                className="flex-1 bg-white border border-green-600 text-green-600 py-0.5 px-2 rounded text-xs hover:bg-green-50"
                onClick={() => window.open(currentTile.product_url, '_blank')}
              >
                See Details / Buy Now
              </button>
              <button
                onClick={() => setCurrentAction('SHOW_TILES')}
                className="flex-1 bg-white border border-green-600 text-green-600 py-0.5 px-2 rounded text-xs hover:bg-green-50"
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

export default AnimatedTileViewer;