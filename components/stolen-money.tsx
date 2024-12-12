"use client";

import React from 'react';

const StolenMoneyTracker: React.FC = () => {
  // Assume a fixed amount of money stolen for demonstration purposes
  const stolenAmount = 1000000; // Example amount in some currency

  return (
    <div className="stolen-money-tracker bg-red-500 text-white p-4 rounded">
      <h2 className="text-xl font-bold">Stolen On-Chain Funds to Date</h2>
      <p className="mt-2 text-center">
        {` $${(stolenAmount * 12.6).toFixed(2)}`}
      </p>
    </div>
  );
};

export default StolenMoneyTracker;

