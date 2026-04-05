import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const colors = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white shadow-lg ${colors[type]} transition-all`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 font-bold hover:opacity-80">&times;</button>
      </div>
    </div>
  );
}
