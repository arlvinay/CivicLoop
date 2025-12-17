import React, { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { CollectionScreen } from './screens/CollectionScreen';
import { SyncScreen } from './screens/SyncScreen';
import { ScannerScreen } from './screens/ScannerScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SetupScreen } from './screens/SetupScreen';
import { BreakdownScreen } from './screens/BreakdownScreen';
import { CopilotScreen } from './screens/CopilotScreen';
import { Header } from './components/Header';
import { AppView } from './types';
import { wasteRepository } from './repositories/WasteRepository';
import { userRepository } from './repositories/UserRepository';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView | null>(null); // Null initial state for loading
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);

  // --- 1. APP STARTUP ("The Traffic Cop") ---
  useEffect(() => {
    const initializeApp = () => {
      // Logic Check 1: Is 'auth_token' present?
      if (!userRepository.isAuthenticated()) {
        setCurrentView(AppView.LOGIN);
        return;
      }

      // Logic Check 2: Is 'is_profile_setup' true?
      if (!userRepository.isProfileSetup()) {
        setCurrentView(AppView.SETUP);
        return;
      }

      // If both yes, go to Home
      setCurrentView(AppView.HOME);
    };

    initializeApp();
  }, []);

  const refreshSyncCount = () => {
    setUnsyncedCount(wasteRepository.getUnsyncedCount());
  };

  useEffect(() => {
    refreshSyncCount();
    window.addEventListener('storage', refreshSyncCount);
    return () => window.removeEventListener('storage', refreshSyncCount);
  }, []);

  // --- Background Sync Scheduler ---
  useEffect(() => {
    const SYNC_INTERVAL_MS = 15 * 60 * 1000;

    const performBackgroundSync = async () => {
      const pending = wasteRepository.getUnsyncedCount();
      if (pending > 0) {
        try {
          await wasteRepository.syncPending();
          refreshSyncCount();
        } catch (e) {
          console.warn("[Background] Sync failed");
        }
      }
    };
    performBackgroundSync();
    const intervalId = setInterval(performBackgroundSync, SYNC_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const renderScreen = () => {
    if (currentView === null) return <div className="h-screen flex items-center justify-center bg-white text-xl font-bold">LOADING...</div>;

    switch (currentView) {
      case AppView.LOGIN:
        return <LoginScreen onNavigate={setCurrentView} />;
      case AppView.SETUP:
        return <SetupScreen onNavigate={setCurrentView} />;
      case AppView.HOME:
        return <HomeScreen onNavigate={setCurrentView} unsyncedCount={unsyncedCount} />;
      case AppView.COLLECTION:
        return <CollectionScreen onNavigate={setCurrentView} onRecordSaved={refreshSyncCount} />;
      case AppView.SCANNER:
        return <ScannerScreen onNavigate={setCurrentView} onRecordSaved={refreshSyncCount} />;
      case AppView.SYNC:
        return <SyncScreen onNavigate={setCurrentView} onSynced={refreshSyncCount} />;
      case AppView.BREAKDOWN:
        return <BreakdownScreen onNavigate={setCurrentView} onRecordSaved={refreshSyncCount} />;
      case AppView.COPILOT:
        return <CopilotScreen onNavigate={setCurrentView} />;
      default:
        return <HomeScreen onNavigate={setCurrentView} unsyncedCount={unsyncedCount} />;
    }
  };

  // Do not show Header on Login, Setup or Copilot (Copilot has its own header)
  const showHeader = currentView !== AppView.LOGIN && currentView !== AppView.SETUP && currentView !== AppView.COPILOT && currentView !== null;

  return (
    <div className="flex flex-col h-screen bg-civic-white text-civic-black no-select">
      {showHeader && (
        <Header 
          currentView={currentView!} 
          onNavigate={setCurrentView} 
          unsyncedCount={unsyncedCount}
        />
      )}
      <main className="flex-1 overflow-hidden relative">
        {renderScreen()}
      </main>
    </div>
  );
};

export default App;