import React from 'react';

interface LargeButtonProps {
  label: string;
  onClick: () => void;
  colorClass: string; // Tailwind bg color class
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const LargeButton: React.FC<LargeButtonProps> = ({ 
  label, 
  onClick, 
  colorClass, 
  icon, 
  disabled = false 
}) => {
  
  const handleInteraction = () => {
    if (disabled) return;
    // Haptic feedback simulation for web
    if (navigator.vibrate) {
      navigator.vibrate(50); 
    }
    onClick();
  };

  return (
    <button
      onClick={handleInteraction}
      disabled={disabled}
      className={`
        w-full h-24 mb-4 rounded-xl shadow-md flex items-center justify-between px-6
        transition-transform active:scale-95 touch-manipulation
        ${disabled ? 'bg-gray-300 cursor-not-allowed opacity-50' : colorClass}
        border-2 border-black
      `}
      aria-label={label}
    >
      <span className="text-xl-ui font-bold text-black uppercase tracking-wider">
        {label}
      </span>
      {icon && <span className="text-black">{icon}</span>}
    </button>
  );
};