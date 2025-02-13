import React, { useState, useEffect } from 'react';
import SalesRender from './SalesRender';

const Sales = ({ data }) => {
  const [salesData, setSalesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // Extract tile names and quantities
        const tile_names = data.tiles.map(tile => tile.name);
      
        const quantities = data.tiles.map(tile => tile.quantity.toString());

        // Make API request
        const response = await fetch('https://obl-chatbot-backend.onrender.com/fetch_sales_data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tile_names }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sales data');
        }

        const responseData = await response.json();
        
        // Combine API response with quantities
        setSalesData({
          tiles: responseData.tiles,
          quantities: quantities,
          total_unique_tiles: data.total_unique_tiles,
          total_quantity: data.total_quantity
        });
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (data && data.tiles) {
      fetchSalesData();
    }
  }, [data]);

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

  if (!salesData) {
    return (
      <div className="text-gray-600 p-4">
        No sales data available.
      </div>
    );
  }

  return <SalesRender salesData={salesData} />;
};

export default Sales;