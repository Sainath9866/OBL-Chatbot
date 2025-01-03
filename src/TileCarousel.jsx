import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAction } from './ActionContent';
import AnimatedTileViewer from './Animated';



const TileCarousel = ({ category, size }) => {

  const [tiles, setTiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setCurrentAction } = useAction();

  useEffect(() => {
    const fetchTiles = async () => {
      try {
        setIsLoading(true);
        const searchParams = new URLSearchParams({
          category,
          size,
        });

        const response = await fetch(`http://127.0.0.1:8000/tiles?${searchParams}`, {
          method: 'POST',
        });

        console.log('Response status:', response.status); // Debug log

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch tiles');
        }

        const data = await response.json();
        setTiles(data.tiles);
      } catch (err) {
        console.error('Fetch error:', err); // Debug log
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTiles();
  }, [category, size]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tiles.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + tiles.length) % tiles.length);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        Error: {error}
      </div>
    );
  }

  if (!tiles.length) {
    return (
      <div className="text-gray-600 p-4">
        No tiles found matching your criteria.
      </div>
    );
  }

  const currentTile = tiles[currentIndex];
  const handleCategoryChange = () => {
    // Dispatch action to chat.jsx
    onAction('SHOW_TILES');
  };


  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      

      <div className="relative">
        

       

        <AnimatedTileViewer
          tiles={tiles}
          currentIndex={currentIndex}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          setCurrentAction={setCurrentAction}
        />
      </div>

      
    </div>
  );
};

export default TileCarousel;