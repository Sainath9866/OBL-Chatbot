import React from 'react';
import SalesRender from './SalesRender';

const Sales = ({ salesData }) => {
  console.log('Sales data in sales.jsx:', salesData);
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