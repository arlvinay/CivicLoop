import React, { useEffect, useState } from 'react';
import { AppView, CollectionStatus, UserRole } from '../types';
import { ICONS } from '../constants';
import { userRepository } from '../repositories/UserRepository';
import { wasteRepository } from '../repositories/WasteRepository';
import { LargeButton } from '../components/LargeButton';

interface HomeScreenProps {
  onNavigate: (view: AppView) => void;
  unsyncedCount: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, unsyncedCount }) => {
  const [user, setUser] = useState(userRepository.getUser());
  const [stats, setStats] = useState({ segregated: 0, mixed: 0, rejected: 0 });
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  
  // Mock Data State for Driver Route (Dynamic)
  const [routeData] = useState({
    id: "RT-42A",
    name: "Indiranagar Loop",
    nextStop: "CMH Road Junction (Bin #12)",
    eta: "5 min",
    status: "ON TIME"
  });

  // Initialize role from user profile, default to Helper if undefined
  const [activeRole, setActiveRole] = useState<UserRole>(user.role || UserRole.HELPER);

  // Load User & Stats
  useEffect(() => {
    setUser(userRepository.getUser());
    if (user.role) setActiveRole(user.role);
    
    // Calculate Today's Stats
    const records = wasteRepository.getAllRecords();
    const segregated = records.filter(r => r.status === CollectionStatus.SEGREGATED).length;
    const mixed = records.filter(r => r.status === CollectionStatus.MIXED).length;
    const rejected = records.filter(r => r.status === CollectionStatus.REJECTED).length;
    
    setStats({ segregated, mixed, rejected });
  }, []);

  // Monitor GPS Accuracy
  useEffect(() => {
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
            setGpsAccuracy(pos.coords.accuracy);
        },
        (err) => {
            console.warn("GPS Watch Error:", err);
            setGpsAccuracy(null);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    }
    return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleLogout = () => {
    const unsynced = wasteRepository.getUnsyncedCount();
    const msg = unsynced > 0 
        ? `Warning: ${unsynced} items not yet synced. Logout anyway?` 
        : "End Shift and Logout?";

    if (window.confirm(msg)) {
      userRepository.logout();
      window.location.reload();
    }
  };

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    userRepository.updateRole(role);
    setUser({ ...user, role });
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const getGpsBadge = () => {
    if (gpsAccuracy === null) {
        return <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-600 text-gray-400 bg-gray-800">NO GPS</span>;
    }
    const val = Math.round(gpsAccuracy);
    if (val <= 20) {
        return <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded border border-civic-green text-civic-green bg-green-900/20">GPS: ±{val}m</span>;
    } else if (val <= 50) {
        return <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded border border-civic-yellow text-civic-yellow bg-yellow-900/20">GPS: ±{val}m</span>;
    } else {
        return <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded border border-civic-red text-civic-red bg-red-900/20">GPS: ±{val}m</span>;
    }
  };

  const renderCleanerWindow = () => (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden animate-in fade-in duration-300">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        <button 
          onClick={() => {
            if(navigator.vibrate) navigator.vibrate(100);
            onNavigate(AppView.SCANNER);
          }}
          className="group relative w-[60vw] h-[60vw] max-w-[280px] max-h-[280px] rounded-full flex flex-col items-center justify-center transition-transform active:scale-95 touch-manipulation mb-8"
        >
          <div className="absolute inset-0 bg-civic-lime rounded-full opacity-30 animate-breathe blur-2xl"></div>
          <div className="relative w-full h-full bg-civic-lime rounded-full border-8 border-civic-black shadow-[0_0_50px_rgba(204,255,0,0.2)] flex flex-col items-center justify-center z-10">
            <div className="scale-[2.5] text-black mb-4">{ICONS.QR}</div>
            <span className="text-black font-black text-2xl uppercase tracking-tighter leading-none text-center">Start<br/>Scan</span>
          </div>
        </button>
        
        <button 
           onClick={() => onNavigate(AppView.COLLECTION)}
           className="z-10 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-full border border-gray-600 shadow-lg flex items-center gap-3 active:scale-95 transition-all"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-civic-lime">
             <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
           </svg>
           <span className="uppercase tracking-widest text-sm">Manual Entry</span>
        </button>
    </div>
  );

  const renderDriverWindow = () => (
    <div className="flex-1 p-6 flex flex-col justify-center animate-in slide-in-from-right duration-300">
      <h3 className="text-gray-400 font-bold uppercase tracking-widest mb-4 text-sm">Vehicle Operations</h3>
      
      <LargeButton 
        label="REPORT BREAKDOWN" 
        onClick={() => onNavigate(AppView.BREAKDOWN)} 
        colorClass="bg-civic-red text-white" 
        icon={<div className="text-white">{ICONS.WRENCH}</div>}
      />

      <LargeButton 
        label="AI COPILOT (MAPS)" 
        onClick={() => onNavigate(AppView.COPILOT)} 
        colorClass="bg-civic-lime" 
        icon={<div className="text-black">{ICONS.ROBOT}</div>}
      />
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button 
          onClick={() => alert("Fuel Logging coming soon in v1.2")} 
          className="bg-civic-orange h-32 rounded-xl flex flex-col items-center justify-center shadow-lg border-2 border-black active:scale-95 transition-transform"
        >
          <div className="scale-150 mb-2 text-black">{ICONS.FUEL}</div>
          <span className="font-black text-black uppercase">Log Fuel</span>
        </button>

        <button 
          onClick={() => onNavigate(AppView.SCANNER)} 
          className="bg-gray-700 h-32 rounded-xl flex flex-col items-center justify-center shadow-lg border-2 border-black active:scale-95 transition-transform"
        >
          <div className="scale-150 mb-2 text-white">{ICONS.QR}</div>
          <span className="font-black text-white uppercase">Quick Scan</span>
        </button>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mt-2 shadow-lg relative overflow-hidden">
        {/* Decorative background icon */}
        <div className="absolute right-[-10px] bottom-[-20px] text-gray-700 opacity-20 scale-[3]">
            {ICONS.MAP_PIN}
        </div>

        <div className="flex justify-between items-start border-b border-gray-700 pb-2 mb-3">
             <div>
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Current Route</span>
                <span className="text-xl font-black text-white block leading-none">{routeData.id}: {routeData.name}</span>
             </div>
             <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                {routeData.status}
             </span>
        </div>

        <div>
             <span className="text-civic-lime text-[10px] font-bold uppercase tracking-widest block mb-1">Next Stop</span>
             <div className="flex items-center gap-2 z-10 relative">
                <span className="text-civic-lime">{ICONS.MAP_PIN}</span>
                <span className="text-lg font-bold text-white leading-tight">{routeData.nextStop}</span>
             </div>
             <div className="text-xs font-mono text-gray-400 mt-1 pl-8">
                ETA: <span className="text-white font-bold">{routeData.eta}</span>
             </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-civic-dark text-white relative">
      
      {/* 1. HEADER & ROLE SWITCHER */}
      <div className="flex flex-col bg-civic-card border-b border-gray-800 shadow-md z-10 pb-0">
        <div className="flex justify-between items-center p-4 pb-2">
          <div>
            <div className="flex items-center">
                <h2 className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mb-1">
                {user.wardId || 'Unknown Ward'}
                </h2>
                {getGpsBadge()}
            </div>
            <h1 className="text-xl font-black text-white leading-none">
              {user.phoneNumber || 'STAFF'}
            </h1>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-gray-800 p-2 rounded-full text-white border border-gray-600 active:bg-civic-red"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>

        {/* ROLE TABS */}
        <div className="flex px-4 pb-4 gap-2">
          <button 
            onClick={() => handleRoleSwitch(UserRole.HELPER)}
            className={`flex-1 py-3 rounded-lg font-black uppercase tracking-wider transition-all border-2 ${
                activeRole === UserRole.HELPER 
                ? 'bg-civic-lime text-black border-civic-lime shadow-[0_0_15px_rgba(204,255,0,0.3)]' 
                : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'
            }`}
          >
            Cleaner
          </button>
          <button 
            onClick={() => handleRoleSwitch(UserRole.DRIVER)}
            className={`flex-1 py-3 rounded-lg font-black uppercase tracking-wider transition-all border-2 ${
                activeRole === UserRole.DRIVER 
                ? 'bg-civic-orange text-black border-civic-orange shadow-[0_0_15px_rgba(255,61,0,0.3)]' 
                : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'
            }`}
          >
            Driver
          </button>
        </div>
      </div>

      {/* 2. MAIN WINDOW CONTENT (SWITCHABLE) */}
      {activeRole === UserRole.HELPER ? renderCleanerWindow() : renderDriverWindow()}

      {/* 3. PROGRESS CARD: Today's Stats (Always visible) */}
      <div className="p-4 pb-8 bg-civic-dark">
        <div className="bg-civic-card rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="bg-black/40 p-2 text-center border-b border-gray-700">
             <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Today's Collection</span>
          </div>
          <div className="flex divide-x divide-gray-700">
            <div className="flex-1 p-3 flex flex-col items-center">
              <span className="text-3xl font-black text-civic-green font-industrial">{stats.segregated}</span>
              <span className="text-civic-green text-[10px] font-bold uppercase mt-1">Segregated</span>
            </div>
            <div className="flex-1 p-3 flex flex-col items-center">
              <span className="text-3xl font-black text-civic-yellow font-industrial">{stats.mixed}</span>
              <span className="text-civic-yellow text-[10px] font-bold uppercase mt-1">Mixed</span>
            </div>
             {stats.rejected > 0 && (
                <div className="flex-1 p-3 flex flex-col items-center bg-civic-red/10">
                  <span className="text-3xl font-black text-civic-red font-industrial">{stats.rejected}</span>
                  <span className="text-civic-red text-[10px] font-bold uppercase mt-1">Rejected</span>
                </div>
             )}
          </div>
        </div>
      </div>

    </div>
  );
};