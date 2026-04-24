import React, { useState, useEffect } from 'react';
import { PdiPayload } from './types';
import { IdleScreen } from './components/pdi/IdleScreen';
import { RoundsLiveScreen } from './components/pdi/RoundsLiveScreen';
import { RoundsResultsScreen } from './components/pdi/RoundsResultsScreen';
import { PyramidLiveScreen } from './components/pdi/PyramidLiveScreen';
import { PyramidWinnerScreen } from './components/pdi/PyramidWinnerScreen';
import { RoundsFinalResults } from './components/pdi/RoundsFinalResults';
import { PyramidBracket } from './components/pdi/PyramidBracket';
import { PoomsaeDrawScreen } from './components/pdi/PoomsaeDrawScreen';
import { FreestylePresentationScreen } from './components/pdi/FreestylePresentationScreen';
import { CompetitionStartScreen } from './components/pdi/CompetitionStartScreen';
import { TechnicalTieScreen } from './components/pdi/TechnicalTieScreen';
import { RoundsFinalists } from './components/pdi/RoundsFinalists';
import { PyramidFinalResultsScreen } from './components/pdi/PyramidFinalResultsScreen';
import { Window } from '@tauri-apps/api/window';
import { ErrorBoundary } from './components/pdi/ErrorBoundary';

const PDI_STORAGE_KEY = 'kalyo-pdi-payload';

export const PublicDisplayApp: React.FC = () => {
  const [payload, setPayload] = useState<PdiPayload>({ view: 'IDLE', data: {} });

  useEffect(() => {
    // Initial load from localStorage (handles page refresh / initial state)
    const initialData = localStorage.getItem(PDI_STORAGE_KEY);
    if (initialData) {
      try {
        setPayload(JSON.parse(initialData));
      } catch (e) {
        console.error("Failed to parse initial PDI payload", e);
      }
    }

    let unlistenTauri: (() => void) | null = null;

    // Primary channel: Tauri events (work cross-window within Tauri)
    if (window.__TAURI__) {
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen<PdiPayload>('kalyo-pdi-update', (event) => {
          setPayload(event.payload);
        }).then((unlisten) => {
          unlistenTauri = unlisten;
        }).catch((e) => {
          console.error("Failed to listen for Tauri PDI events", e);
        });
      });
    }

    // Fallback channel: localStorage storage event (works in browser dev mode between tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === PDI_STORAGE_KEY && event.newValue) {
        try {
          setPayload(JSON.parse(event.newValue));
        } catch (e) {
          console.error("Failed to parse PDI payload from storage event", e);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (unlistenTauri) unlistenTauri();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        const appWindow = Window.getCurrent();
        appWindow.isFullscreen().then(fullscreen => {
          appWindow.setFullscreen(!fullscreen);
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const renderView = () => {
    switch (payload.view) {
      case 'IDLE':
        return <IdleScreen />;
      case 'ROUNDS_LIVE':
        return <RoundsLiveScreen {...payload.data} />;
      case 'ROUNDS_RESULTS':
        return <RoundsResultsScreen {...payload.data} />;
      case 'PYRAMID_LIVE':
          return <PyramidLiveScreen {...payload.data} />;
      case 'PYRAMID_WINNER':
          return <PyramidWinnerScreen {...payload.data} />;
      case 'PYRAMID_FINAL_RESULTS':
          return <PyramidFinalResultsScreen {...payload.data} />;
      case 'ROUNDS_FINAL_RESULTS':
          return <RoundsFinalResults {...payload.data} />;
      case 'PYRAMID_BRACKET':
          return <PyramidBracket {...payload.data} />;
      case 'POOMSAE_DRAW':
          return <PoomsaeDrawScreen {...payload.data} />;
      case 'COMPETITION_START':
          return <CompetitionStartScreen {...payload.data} />;
      case 'FREESTYLE_PRESENTATION':
          return <FreestylePresentationScreen data={payload.data} />;
      case 'TECHNICAL_TIE':
          return <TechnicalTieScreen {...payload.data} />;
      case 'ROUNDS_QUALIFICATION_RESULTS':
          return <RoundsResultsScreen {...payload.data} />;
      case 'ROUNDS_FINALISTS':
          return <RoundsFinalists {...payload.data} />;
      default:
        return <IdleScreen />;
    }
  };

  return (
    <main className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">
      <ErrorBoundary>
        {renderView()}
      </ErrorBoundary>
    </main>
  );
};
