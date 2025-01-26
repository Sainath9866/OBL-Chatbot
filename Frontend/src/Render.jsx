import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const SuggestedOptionsViewer = ({ suggested_options, setCurrentAction }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const componentRef = useRef(null);

  // Intersection Observer to track visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // Trigger when at least 10% of component is visible
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

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % suggested_options.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + suggested_options.length) % suggested_options.length);
  };

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

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const AutoClickingButton = () => {
    useEffect(() => {
      let intervalId;
      
      if (isPlaying && suggested_options.length > 1 && !isAnimating && isVisible) {
        intervalId = setInterval(() => {
          handleNextWithAnimation();
        }, 5000);
      }

      return () => clearInterval(intervalId);
    }, [isPlaying, suggested_options.length, isAnimating, isVisible]);

    return null;
  };

  const currentOption = suggested_options[currentIndex];

  return (
    <div ref={componentRef} className="bg-white rounded-lg shadow-lg p-3 max-w-md">
      <div className="text-sm font-medium mb-2">
        Found {suggested_options.length} matching items 🎯
      </div>

      <div className="relative overflow-hidden">
        <div className={`transform transition-all duration-300 ease-in-out ${
          slideDirection === 'slide-left' ? '-translate-x-full' :
          slideDirection === 'slide-right' ? 'translate-x-full' :
          'translate-x-0'
        }`}>
          <div className="w-full">
            {/* Image Container */}
            <div className="relative aspect-[4/3] mb-2">
              <img
                src={currentOption.image_url}
                alt={currentOption.label}
                className="w-full h-full object-cover rounded-lg"
              />
              
              {/* Navigation Overlay */}
              <div className="absolute inset-0 flex items-center justify-between px-2">
                <button
                  onClick={handlePreviousWithAnimation}
                  className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-1.5"
                  disabled={suggested_options.length <= 1 || isAnimating}
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={handleNextWithAnimation}
                  className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-1.5"
                  disabled={suggested_options.length <= 1 || isAnimating}
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Counter and Play/Pause */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-between items-center px-2">
                <div className="text-xs text-white bg-black bg-opacity-50 px-2 py-0.5 rounded">
                  {currentIndex + 1}/{suggested_options.length}
                </div>
                <button 
                  onClick={togglePlayPause}
                  className="text-white bg-black bg-opacity-50 p-1.5 rounded-full hover:bg-opacity-70"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
              </div>
            </div>

           {/* Compact Info Section */}
           <div className="space-y-1 text-sm">
              <div className="flex justify-between items-baseline">
                <h2 className="font-bold">{currentOption.name}</h2>
                <p className="font-bold">₹{currentOption.price}/sq.ft</p>
              </div>
              
              <div className="justify-between text-sm">
                <span className='font-bold'>Size : </span>
                <span className='font-semibold'>{currentOption.size}</span>
                
                <span className='font-bold'>    Finish : </span>
                <span className='font-semibold'>{currentOption.finish}</span>
              </div>

              {/* Compact Specs */}
              <div className="text-sm">
                <span className="font-bold">Material: </span><span className='font-semibold'>{currentOption.material}</span>
                <div className='font-bold'>Applicable for: </div><div className='font-semibold'>{currentOption.applications}</div>
              </div>

              {/* Action Buttons */}
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
          </div>
        </div>

        <AutoClickingButton />
      </div>
    </div>
  );
};

export default SuggestedOptionsViewer;