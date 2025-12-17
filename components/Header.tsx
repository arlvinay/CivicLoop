import React from 'react';
import { AppView } from '../types';
import { ICONS } from '../constants';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  unsyncedCount: number;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, unsyncedCount }) => {
  return (
    <header className="bg-civic-black text-civic-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
      <div 
        className="flex items-center gap-3 cursor-pointer" 
        onClick={() => onNavigate(AppView.HOME)}
      >
        <div className="text-civic-green">{ICONS.TRUCK}</div>
        <h1 className="text-xl font-bold tracking-tight">CivicLoop</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {currentView !== AppView.HOME && (
          <button 
            onClick={() => onNavigate(AppView.HOME)}
            className="font-bold text-lg underline"
          >
            Home
          </button>
        )}
        
        <div 
          className="relative cursor-pointer p-2"
          onClick={() => onNavigate(AppView.SYNC)}
        >
          {ICONS.CLOUD_UPLOAD}
          {unsyncedCount > 0 && (
            <span className="absolute top-0 right-0 bg-civic-red text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-civic-black">
              {unsyncedCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};