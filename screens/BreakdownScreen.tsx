import React, { useState, useEffect } from 'react';
import { AppView, BreakdownRecord, MOCK_DRIVER_ID } from '../types';
import { LargeButton } from '../components/LargeButton';
import { ICONS } from '../constants';
import { wasteRepository } from '../repositories/WasteRepository';

interface BreakdownScreenProps {
  onNavigate: (view: AppView) => void;
  onRecordSaved: () => void;
}

export const BreakdownScreen: React.FC<BreakdownScreenProps> = ({ onNavigate, onRecordSaved }) => {
  const [details, setDetails] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gps, setGps] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
           console.warn("GPS failed", err);
           setGps({ lat: 0, lng: 0 });
        },
        { enableHighAccuracy: true }
      );
    } else {
        setGps({ lat: 0, lng: 0 });
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!details.trim()) {
      alert("Please describe the issue.");
      return;
    }

    const record: BreakdownRecord = {
      id: crypto.randomUUID(),
      driver_id: MOCK_DRIVER_ID,
      timestamp: new Date().toISOString(),
      details: details,
      gps: gps || { lat: 0, lng: 0 },
      image_url: imagePreview || undefined,
      is_synced: false
    };

    wasteRepository.saveBreakdown(record);
    onRecordSaved();

    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    alert("Report Saved Locally!");
    onNavigate(AppView.HOME);
  };

  return (
    <div className="flex flex-col h-full p-4 bg-white">
      <div className="mb-6 border-b-4 border-civic-red pb-2">
        <h2 className="text-3xl font-black text-civic-red uppercase">Report Breakdown</h2>
        <p className="text-gray-500 font-bold">Vehicle: KA-01-HH-1234</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <label className="block text-lg font-bold uppercase mb-2 text-gray-800">1. What happened?</label>
        <textarea 
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="E.g. Flat tire, Engine smoke, Stuck in mud..."
          className="w-full h-32 p-4 text-xl border-2 border-black rounded-xl mb-6 focus:border-civic-red focus:outline-none bg-gray-50"
        />

        <label className="block text-lg font-bold uppercase mb-2 text-gray-800">2. Photo (Optional)</label>
        <label className="block w-full mb-8">
           <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          <div className="h-40 border-4 border-dashed border-gray-400 rounded-xl flex items-center justify-center cursor-pointer bg-gray-100 active:bg-gray-200">
            {imagePreview ? (
              <img src={imagePreview} alt="Breakdown" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                {ICONS.CAMERA}
                <span className="font-bold mt-2 uppercase">Take Photo</span>
              </div>
            )}
          </div>
        </label>
      </div>

      <LargeButton 
        label="SAVE REPORT" 
        onClick={handleSubmit}
        colorClass="bg-civic-red text-white"
        icon={ICONS.WRENCH}
      />
      
      <button 
        onClick={() => onNavigate(AppView.HOME)}
        className="w-full py-4 text-center text-gray-500 font-bold underline"
      >
        CANCEL
      </button>
    </div>
  );
};