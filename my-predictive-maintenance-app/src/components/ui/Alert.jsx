// src/components/ui/Alert.jsx
import React from 'react';

export const Alert = ({ variant, children }) => {
  const variantClasses = {
    destructive: 'bg-red-500 text-white',
    // Add more variants if needed
  };

  return (
    <div className={`p-4 rounded ${variantClasses[variant]}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children }) => (
  <p className="text-sm">
    {children}
  </p>
);
