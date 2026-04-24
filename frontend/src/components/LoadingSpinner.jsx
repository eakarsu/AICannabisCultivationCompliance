import React from 'react';
import { FaCannabis } from 'react-icons/fa';

function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="leaf-spinner">
        <FaCannabis />
      </div>
      <div className="loading-text">{text}</div>
    </div>
  );
}

export default LoadingSpinner;
