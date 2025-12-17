import React, { useState } from 'react';
import { AppView, UserRole } from '../types';
import { LargeButton } from '../components/LargeButton';
import { userRepository } from '../repositories/UserRepository';

interface SetupScreenProps {
  onNavigate: (view: AppView) => void;
}

const WARDS = ['Ward 1 - Indiranagar', 'Ward 2 - Koramangala', 'Ward 3 - Whitefield', 'Ward 4 - Jayanagar'];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onNavigate }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [ward, setWard] = useState<string>(WARDS[0]);

  const handleSave = () => {
    if (!role) {
      alert("Please select your role (Driver or Helper)");
      return;
    }

    userRepository.completeSetup(role, ward);
    onNavigate(AppView.HOME);
  };

  return (
    <div className="flex flex-col h-full p-6 bg-civic-white">
      <h2 className="text-3xl font-black mb-6 uppercase border-b-4 border-civic-green inline-block pb-2">
        Profile Setup
      </h2>
      
      <div className="flex-1 overflow-y-auto">
        {/* Role Selection */}
        <div className="mb-8">
          <label className="block text-lg font-bold uppercase mb-4 text-gray-800">1. I am a...</label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setRole(UserRole.DRIVER)}
              className={`h-32 border-4 rounded-xl flex flex-col items-center justify-center font-black text-xl uppercase transition-all ${role === UserRole.DRIVER ? 'border-civic-green bg-green-50 scale-105 shadow-xl' : 'border-gray-300 text-gray-400'}`}
            >
              <span className="text-4xl mb-2">🚛</span>
              Driver
            </button>
            <button 
              onClick={() => setRole(UserRole.HELPER)}
              className={`h-32 border-4 rounded-xl flex flex-col items-center justify-center font-black text-xl uppercase transition-all ${role === UserRole.HELPER ? 'border-civic-green bg-green-50 scale-105 shadow-xl' : 'border-gray-300 text-gray-400'}`}
            >
              <span className="text-4xl mb-2">🧤</span>
              Helper
            </button>
          </div>
        </div>

        {/* Ward Selection */}
        <div className="mb-8">
          <label className="block text-lg font-bold uppercase mb-4 text-gray-800">2. Select Work Zone</label>
          <div className="relative">
            <select 
              value={ward} 
              onChange={(e) => setWard(e.target.value)}
              className="w-full text-xl font-bold p-4 rounded-xl border-4 border-black bg-white appearance-none"
            >
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              ▼
            </div>
          </div>
        </div>
      </div>

      <LargeButton 
        label="SAVE & CONTINUE" 
        onClick={handleSave}
        colorClass="bg-civic-green"
        disabled={!role}
      />
    </div>
  );
};