import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import { AppView, CollectionStatus, CollectionRecord, MOCK_DRIVER_ID } from '../types';
import { LargeButton } from '../components/LargeButton';
import { ICONS } from '../constants';
import { wasteRepository } from '../repositories/WasteRepository';

interface ScannerScreenProps {
  onNavigate: (view: AppView) => void;
  onRecordSaved: () => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ onNavigate, onRecordSaved }) => {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gps, setGps] = useState<{lat: number, lng: number} | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "reader-container";

  // Audio Context for Beep
  const playSound = (type: 'scan' | 'click') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'scan') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High beep
        osc.type = 'square';
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // Low beep
        osc.type = 'sine';
      }
      
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 200);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("GPS failed", err),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }

    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    scanner.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Only process if we don't already have a code
        if (!scannedCode && scannerRef.current?.isScanning) {
          scannerRef.current.pause(true); 
          playSound('scan');
          if (navigator.vibrate) navigator.vibrate(200);
          setScannedCode(decodedText);
        }
      },
      (errorMessage) => { }
    ).catch(err => {
      console.error("Camera start failed", err);
      setErrorMsg("Camera Access Denied. Check Permissions.");
    });

    return () => {
      // CLEANUP: Ensure we stop scanning before clearing to avoid exceptions
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
           scannerRef.current.stop()
            .then(() => {
                // Only clear after stop is complete
                try { scannerRef.current?.clear(); } catch(e) {}
            })
            .catch(err => {
                console.warn("Scanner stop failed", err);
                try { scannerRef.current?.clear(); } catch(e) {}
            });
        } else {
            // Not scanning (paused or never started), safe to clear
            try { 
                scannerRef.current.clear(); 
            } catch(e) {
                // Ignore if element already cleared
            }
        }
      }
    };
  }, []);

  const handleClassification = (status: CollectionStatus) => {
    if (!scannedCode) return;

    playSound('click');

    const record: CollectionRecord = {
      collection_id: crypto.randomUUID(),
      driver_id: MOCK_DRIVER_ID,
      household_id: scannedCode,
      status: status,
      timestamp: new Date().toISOString(),
      gps: gps || { lat: 0, lng: 0 },
      is_synced: false
    };

    wasteRepository.saveCollection(record);
    onRecordSaved();

    setScannedCode(null);
    // Resume scanning for next item
    if (scannerRef.current) {
        try {
            scannerRef.current.resume();
        } catch (e) {
            console.warn("Failed to resume scanner", e);
        }
    }
  };

  return (
    <div className="h-full w-full bg-black relative flex flex-col">
      <div id={regionId} className="w-full h-full object-cover bg-black" />

      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={() => onNavigate(AppView.HOME)}
          className="bg-white/80 p-3 rounded-full shadow-lg border-2 border-black"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
      </div>

      {errorMsg && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-6 text-center">
          <div>
            <div className="text-civic-red mb-4 text-4xl">⚠️</div>
            <h2 className="text-xl font-bold">{errorMsg}</h2>
            <button 
              onClick={() => onNavigate(AppView.HOME)}
              className="mt-6 bg-white text-black px-6 py-3 rounded-lg font-bold"
            >
              GO BACK
            </button>
          </div>
        </div>
      )}

      {scannedCode && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-4 border-4 border-black shadow-2xl animate-in fade-in zoom-in duration-200">
            
            <div className="text-center mb-6">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Household ID</p>
              <h2 className="text-3xl font-black truncate">{scannedCode}</h2>
            </div>

            <div className="flex flex-col gap-3">
              <LargeButton 
                label="SEGREGATED" 
                onClick={() => handleClassification(CollectionStatus.SEGREGATED)}
                colorClass="bg-civic-green hover:brightness-90"
                icon={ICONS.CHECK}
              />
              <LargeButton 
                label="MIXED WASTE" 
                onClick={() => handleClassification(CollectionStatus.MIXED)}
                colorClass="bg-civic-yellow hover:brightness-90"
                icon={ICONS.WARNING}
              />
              <LargeButton 
                label="REJECTED" 
                onClick={() => handleClassification(CollectionStatus.REJECTED)}
                colorClass="bg-civic-red text-white hover:brightness-90"
                icon={<div className="text-white">{ICONS.X}</div>}
              />
            </div>

            <div className="text-center mt-4 text-xs text-gray-400 font-bold uppercase">
              Select status to save & continue
            </div>
          </div>
        </div>
      )}
    </div>
  );
};