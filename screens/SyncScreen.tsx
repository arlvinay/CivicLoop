import React, { useState, useEffect } from 'react';
import { AppView, CollectionRecord } from '../types';
import { LargeButton } from '../components/LargeButton';
import { wasteRepository } from '../repositories/WasteRepository';
import { ICONS } from '../constants';

interface SyncScreenProps {
  onNavigate: (view: AppView) => void;
  onSynced: () => void;
}

export const SyncScreen: React.FC<SyncScreenProps> = ({ onNavigate, onSynced }) => {
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const refreshRecords = () => {
    setRecords(wasteRepository.getAllRecords());
  };

  useEffect(() => {
    refreshRecords();
  }, []);

  const unsyncedCount = records.filter(r => !r.is_synced).length;
  const syncedCount = records.length - unsyncedCount;

  const handleSync = async () => {
    if (unsyncedCount === 0) return;

    setIsSyncing(true);
    setSyncStatus('Connecting to Server...');

    try {
      setSyncStatus(`Uploading ${unsyncedCount} records...`);
      const count = await wasteRepository.syncPending();
      
      setSyncStatus(`Sync Complete! (${count} uploaded)`);
      setIsSyncing(false);
      refreshRecords();
      onSynced();
      
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    } catch (e) {
      setSyncStatus('Sync Failed. Try Again.');
      setIsSyncing(false);
      if (navigator.vibrate) navigator.vibrate(500);
    }
  };

  const handleClear = () => {
     if (confirm("Remove already uploaded records from this device?")) {
        wasteRepository.clearSyncedRecords();
        refreshRecords();
     }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-800 text-white p-6 rounded-xl mb-6 text-center shadow-lg">
        <h2 className="text-3xl font-bold mb-2">{unsyncedCount}</h2>
        <p className="uppercase tracking-widest text-sm text-gray-400">Records Pending Upload</p>
      </div>

      <div className="flex-1">
        <div className="bg-white border-2 border-black rounded-xl p-4 mb-4 h-64 overflow-y-auto">
          <h3 className="font-bold border-b pb-2 mb-2">History Log</h3>
          {records.length === 0 && <p className="text-gray-500 text-center mt-10">No records found.</p>}
          {records.slice().reverse().map((rec) => (
             <div key={rec.collection_id} className="flex justify-between items-center py-3 border-b border-gray-100">
               <div>
                 <div className="font-bold">{rec.household_id}</div>
                 <div className="text-xs text-gray-500">{new Date(rec.timestamp).toLocaleTimeString()}</div>
               </div>
               <div className="flex items-center gap-2">
                 <span className={`
                    px-2 py-1 rounded text-xs font-bold uppercase
                    ${rec.status === 'segregated' ? 'bg-civic-green text-black' : ''}
                    ${rec.status === 'mixed' ? 'bg-civic-yellow text-black' : ''}
                    ${rec.status === 'rejected' ? 'bg-civic-red text-white' : ''}
                    ${rec.status === 'locked' ? 'bg-gray-300 text-black' : ''}
                 `}>
                   {rec.status}
                 </span>
                 {rec.is_synced ? (
                   <span className="text-civic-green">{ICONS.CHECK}</span> 
                 ) : (
                   <div className="h-3 w-3 rounded-full bg-civic-red"></div>
                 )}
               </div>
             </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {syncStatus && (
          <div className="text-center font-bold mb-4 animate-pulse text-blue-700">
            {syncStatus}
          </div>
        )}
        
        <LargeButton 
          label={isSyncing ? "SYNCING..." : "UPLOAD DATA"} 
          onClick={handleSync}
          disabled={unsyncedCount === 0 || isSyncing}
          colorClass="bg-blue-600 text-white"
          icon={<div className="text-white">{ICONS.CLOUD_UPLOAD}</div>}
        />
        
        {syncedCount > 0 && (
            <button 
                onClick={handleClear}
                className="w-full text-center text-gray-500 underline py-2 font-bold"
            >
                Clear History (Free up space)
            </button>
        )}
      </div>
    </div>
  );
};