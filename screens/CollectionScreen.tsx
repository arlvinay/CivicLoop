import React, { useState, useEffect } from 'react';
import { AppView, CollectionStatus, CollectionRecord, MOCK_DRIVER_ID } from '../types';
import { LargeButton } from '../components/LargeButton';
import { ICONS } from '../constants';
import { wasteRepository } from '../repositories/WasteRepository';
import { analyzeWasteImage } from '../services/gemini';

interface CollectionScreenProps {
  onNavigate: (view: AppView) => void;
  onRecordSaved: () => void;
}

export const CollectionScreen: React.FC<CollectionScreenProps> = ({ onNavigate, onRecordSaved }) => {
  const [householdId, setHouseholdId] = useState<string>('');
  const [gps, setGps] = useState<{lat: number, lng: number} | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<CollectionStatus | null>(null);

  useEffect(() => {
    setHouseholdId(`HH-${Math.floor(Math.random() * 10000)}`);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGps({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (err) => {
          console.warn(`GPS Access Failed: ${err.message} (Code: ${err.code}). Defaulting to 0,0.`);
          setGps({ lat: 0, lng: 0 });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setGps({ lat: 0, lng: 0 });
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        
        setIsAnalyzing(true);
        const suggestion = await analyzeWasteImage(base64);
        setAiSuggestion(suggestion);
        setIsAnalyzing(false);
        
        if (suggestion && navigator.vibrate) navigator.vibrate([100, 50, 100]);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const saveCollection = (status: CollectionStatus) => {
    const record: CollectionRecord = {
      collection_id: crypto.randomUUID(),
      driver_id: MOCK_DRIVER_ID,
      household_id: householdId,
      status: status,
      timestamp: new Date().toISOString(),
      gps: gps || { lat: 0, lng: 0 },
      is_synced: false,
      image_url: imagePreview || undefined
    };

    wasteRepository.saveCollection(record);
    onRecordSaved();
    
    if (navigator.vibrate) navigator.vibrate(200);
    onNavigate(AppView.HOME);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 bg-gray-50 p-3 rounded border border-black">
        <h3 className="text-md font-bold text-gray-600 uppercase">Household</h3>
        <p className="text-2xl font-black">{householdId}</p>
        <div className="text-xs text-gray-500 font-mono mt-1">
          {gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Locating...'}
          {gps && gps.lat === 0 && gps.lng === 0 && <span className="text-red-500 ml-2">(GPS Signal Lost)</span>}
        </div>
      </div>

      <div className="mb-6">
        <label className="block w-full">
           <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          <div className={`h-32 border-4 border-dashed rounded-xl flex items-center justify-center cursor-pointer ${aiSuggestion ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-gray-100'}`}>
            {imagePreview ? (
              <div className="relative w-full h-full p-1">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img src={imagePreview} className="w-full h-full object-cover rounded" />
                {isAnalyzing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold animate-pulse">ANALYZING...</div>}
                {aiSuggestion && !isAnalyzing && <div className="absolute bottom-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-lg text-sm border-2 border-white">AI: {aiSuggestion}</div>}
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">{ICONS.CAMERA}<span className="font-bold mt-2">TAP TO PHOTO SCAN</span></div>
            )}
          </div>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h3 className="text-lg font-bold mb-2">SELECT STATUS:</h3>
        <LargeButton label="SEGREGATED (DRY/WET)" onClick={() => saveCollection(CollectionStatus.SEGREGATED)} colorClass={`bg-civic-green ${aiSuggestion === CollectionStatus.SEGREGATED ? 'ring-4 ring-blue-500 scale-105' : ''}`} icon={ICONS.CHECK} />
        <LargeButton label="MIXED WASTE" onClick={() => saveCollection(CollectionStatus.MIXED)} colorClass={`bg-civic-yellow ${aiSuggestion === CollectionStatus.MIXED ? 'ring-4 ring-blue-500 scale-105' : ''}`} icon={ICONS.WARNING} />
        <LargeButton label="REJECTED" onClick={() => saveCollection(CollectionStatus.REJECTED)} colorClass={`bg-civic-red text-white ${aiSuggestion === CollectionStatus.REJECTED ? 'ring-4 ring-blue-500 scale-105' : ''}`} icon={<div className="text-white">{ICONS.X}</div>} />
        <LargeButton label="HOUSE LOCKED" onClick={() => saveCollection(CollectionStatus.LOCKED)} colorClass="bg-gray-300" />
      </div>
    </div>
  );
};