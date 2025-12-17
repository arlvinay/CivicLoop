import React, { useState } from 'react';
import { AppView } from '../types';
import { LargeButton } from '../components/LargeButton';
import { userRepository } from '../repositories/UserRepository';

interface LoginScreenProps {
  onNavigate: (view: AppView) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    if (phone.length < 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }
    if (isRegister && name.trim().length < 3) {
      alert("Please enter your full name");
      return;
    }

    setIsLoading(true);
    
    // Simulate API Call / Firebase Auth
    setTimeout(() => {
      const mockToken = "auth_token_" + Date.now();
      // In a real app, registration would save the user profile remotely
      userRepository.login(phone, mockToken);
      setIsLoading(false);
      
      // Navigate to Setup (Next Step in Logic Flow)
      onNavigate(AppView.SETUP);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full p-6 justify-center bg-civic-white">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-civic-black mb-2">CIVIC LOOP</h1>
        <p className="text-xl text-gray-500 font-bold uppercase tracking-widest">Driver App</p>
      </div>

      {/* Toggle */}
      <div className="flex bg-gray-200 p-1 rounded-xl mb-6">
        <button 
            className={`flex-1 py-3 font-bold uppercase rounded-lg transition-all ${!isRegister ? 'bg-white shadow-md text-black' : 'text-gray-500'}`}
            onClick={() => setIsRegister(false)}
        >
            Login
        </button>
        <button 
            className={`flex-1 py-3 font-bold uppercase rounded-lg transition-all ${isRegister ? 'bg-white shadow-md text-black' : 'text-gray-500'}`}
            onClick={() => setIsRegister(true)}
        >
            Register
        </button>
      </div>

      <div className="bg-gray-100 p-6 rounded-xl border-2 border-black mb-8 shadow-sm">
        {isRegister && (
            <div className="mb-4">
                <label className="block text-sm font-bold uppercase mb-2 text-gray-600">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xl font-bold p-3 rounded border-2 border-gray-300 text-civic-black focus:border-civic-green focus:outline-none bg-white placeholder-gray-300"
                />
            </div>
        )}

        <div>
            <label className="block text-sm font-bold uppercase mb-2 text-gray-600">Mobile Number</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g,''))}
              placeholder="98765 43210"
              className="w-full text-3xl font-black p-3 rounded border-2 border-gray-300 text-civic-black focus:border-civic-green focus:outline-none bg-white placeholder-gray-300"
              maxLength={10}
            />
            {/* Dynamic Feedback Text Below Input */}
            <div className="h-6 mt-2">
                {phone.length > 0 && phone.length < 10 && (
                    <p className="text-sm font-bold text-gray-400 animate-pulse">
                        Entering... ({phone.length}/10)
                    </p>
                )}
                {phone.length === 10 && (
                    <p className="text-sm font-bold text-civic-green flex items-center gap-1">
                       ✓ Valid Mobile Number
                    </p>
                )}
            </div>
        </div>
      </div>

      <LargeButton 
        label={isLoading ? (isRegister ? "REGISTERING..." : "LOGGING IN...") : (isRegister ? "REGISTER" : "GET OTP")} 
        onClick={handleAction}
        colorClass="bg-civic-black text-white"
        disabled={isLoading || phone.length < 10 || (isRegister && name.length < 3)}
      />
      
      <p className="text-center text-xs text-gray-400 mt-4">
        {isRegister ? "By registering, you agree to the Terms of Service." : "Standard carrier rates may apply for OTP."}
      </p>
    </div>
  );
};