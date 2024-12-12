"use client";

import React, { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress";

const GasPriceBar: React.FC = () => {
  const [gasPrice, setGasPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchGasPrice = async () => {
      try {
        const response = await fetch('/api/tracker/gas');
        if (!response.ok) {
          throw new Error('Failed to fetch gas price');
        }
        const data = await response.json();
        setGasPrice(data.result.ProposeGasPrice); // Assuming the API returns this structure
      } catch (error) {
        console.error('Error fetching gas price:', error);
      }
    };

    fetchGasPrice();
  }, []);

  const getProgressValue = (price: number) => {
    if (price < 50) return 33; // Cheap
    if (price < 100) return 66; // Moderate
    return 100; // Expensive
  };

  return (
    <div className="gas-price-bar p-4 rounded text-white text-center">
      {gasPrice !== null ? (
        <div>
          <span className="font-bold">Current Gas Price: </span>
          <span>{gasPrice} Gwei</span>
          <div className="flex items-center mt-2">
            <span className="text-sm text-cyan-500 mr-2">Gas is cheap</span>
            <Progress 
              value={30} 
                className="w-[100%] bg-gray-900"
                indicatorClassName="bg-gradient-to-r from-cyan-50 to-cyan-500"
            />
            <span className="text-sm text-red-500 ml-2">Gas is expensive</span>
          </div>
        </div>
      ) : (
        <div className="text-gray-400">Loading gas price...</div>
      )}
    </div>
  );
};

export default GasPriceBar;
