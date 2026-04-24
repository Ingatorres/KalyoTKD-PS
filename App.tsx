import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Screen, Event, Category } from './types';
import { initDb, getEvents, saveEvent, saveCategory } from "./src/database";
import { updatePdi } from './tauriUtils';

import { SplashScreen } from './components/SplashScreen';
import { ActivationScreen } from './components/ActivationScreen';
import { HomeScreen } from './components/HomeScreen';
import { NewEventScreen } from './components/NewEventScreen'; // Asumo que este archivo existe
import { ExistingEventsScreen } from './components/ExistingEventsScreen'; // Asumo que este archivo existe
import { CategoryScreen } from './components/CategoryScreen'; // Asumo que este archivo existe
import { CompetitionScreen } from './components/CompetitionScreen.tsx'; // Asumo que este archivo existe
import { PoomsaeConfigScreen } from './components/PoomsaeConfigScreen';
import { ResultsViewer } from './components/ResultsViewer';
import { PyramidImportModal } from './components/PyramidImportModal';
import { Window } from '@tauri-apps/api/window';

export default function App() {
  const [expirationDate, setExpirationDate] = useLocalStorage<string | null>('kalyo-tkd-expiration', null);
  const [isActivated, setIsActivated] = useState(false);
  const [screen, setScreen] = useState<Screen>('SPLASH');
  const [showPyramidImportModal, setShowPyramidImportModal] = useState(false);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEventId, setCurrentEventId] = useLocalStorage<string | null>('kalyo-tkd-current-event', null);
  const [currentCategoryId, setCurrentCategoryId] = useLocalStorage<string | null>('kalyo-tkd-current-category', null);
  const [currentMatchId, setCurrentMatchId] = useLocalStorage<string | null>('kalyo-tkd-current-match', null);
  const [viewingEventId, setViewingEventId] = useState<string | null>(null); // For auto-viewing a finalized event
  const [isLoading, setIsLoading] = useState(true);

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

  // Check activation status on startup
  useEffect(() => {
    if (expirationDate) {
      const today = new Date();
      const expiry = new Date(expirationDate);
      if (today < expiry) {
        setIsActivated(true);
      } else {
        setIsActivated(false);
      }
    } else {
      setIsActivated(false);
    }
  }, [expirationDate]);

  // DB Init
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDb();
        const loadedEvents = await getEvents();
        setEvents(loadedEvents);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  // Splash Screen
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      setScreen(isActivated ? 'HOME' : 'ACTIVATION');
    }, 3000);
    return () => clearTimeout(timer);
  }, [isActivated, isLoading]);

  // PDI Reset
  useEffect(() => {
    if (screen !== 'COMPETITION' && screen !== 'RESULTS_VIEWER') {
      updatePdi({ view: 'IDLE', data: {} });
    }
  }, [screen]);

  const handleActivation = (newExpirationDate: Date) => {
    setExpirationDate(newExpirationDate.toISOString());
    setIsActivated(true);
    setScreen('HOME');
  };

  const addEvent = useCallback(async (event: Event) => {
    await saveEvent(event);
    setEvents(prev => [...prev, event]);
  }, []);

  const updateEvent = useCallback(async (updatedEvent: Event) => {
    await saveEvent(updatedEvent);
    setEvents(prevEvents => prevEvents.map(event => event.id === updatedEvent.id ? updatedEvent : event));
  }, []);

  const updateCategory = useCallback(async (updatedCategory: Category) => {
    if (!currentEventId) return;
    await saveCategory(updatedCategory, currentEventId);
    setEvents(prevEvents => prevEvents.map(event => {
        if (event.id === currentEventId) {
            const categoryExists = event.categories.some(cat => cat.id === updatedCategory.id);
            const newCategories = categoryExists
                ? event.categories.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat)
                : [...event.categories, updatedCategory];
            return { ...event, categories: newCategories };
        }
        return event;
    }));
  }, [currentEventId]);

  const selectEvent = (eventId: string) => {
    setCurrentEventId(eventId);
    setScreen('CATEGORY');
  };

  const currentEvent = events.find(e => e.id === currentEventId) || null;
  const currentCategory = currentEvent?.categories.find(c => c.id === currentCategoryId) || null;

  const handleFinalizeEvent = useCallback(() => {
    if (!currentEvent) return;
    const finalizedEvent = { ...currentEvent, status: 'completed' as const };
    updateEvent(finalizedEvent);
    setViewingEventId(finalizedEvent.id); // Set the event to be viewed
    setScreen('EXISTING_EVENTS'); // Navigate to the events screen
  }, [currentEvent, updateEvent]);

  const renderScreen = () => {
    if (isLoading && screen !== 'SPLASH') {
        return <div>Cargando base de datos...</div>;
    }

    switch (screen) {
      case 'SPLASH':
        return <SplashScreen />;
      case 'ACTIVATION':
        return <ActivationScreen onActivate={handleActivation} />;
      case 'HOME':
        return <HomeScreen 
          setScreen={setScreen} 
          hasEvents={events.length > 0} 
          isActivated={isActivated}
          onImportPyramids={() => setShowPyramidImportModal(true)}
        />;
      case 'NEW_EVENT':
        return <NewEventScreen addEvent={addEvent} setScreen={setScreen} setCurrentEventId={setCurrentEventId} />;
      case 'EXISTING_EVENTS':
        return <ExistingEventsScreen events={events} onSelectEvent={selectEvent} setScreen={setScreen} viewingEventId={viewingEventId} setViewingEventId={setViewingEventId} setCurrentEventId={setCurrentEventId} setCurrentCategoryId={setCurrentCategoryId} />;
      case 'CATEGORY':
        return <CategoryScreen event={currentEvent} isActivated={isActivated} updateCategory={updateCategory} updateEvent={updateEvent} setScreen={setScreen} setCurrentCategoryId={setCurrentCategoryId} handleFinalizeEvent={handleFinalizeEvent} />;
      case 'POOMSAE_CONFIG':
        if (!currentEvent || !currentCategory) { setScreen('HOME'); return null; }
        return <PoomsaeConfigScreen event={currentEvent} category={currentCategory} updateCategory={updateCategory} setScreen={setScreen} setCurrentMatchId={setCurrentMatchId} />;
      case 'COMPETITION':
        if (!currentEvent || !currentCategory) { setScreen('HOME'); return null; }
        return <CompetitionScreen event={currentEvent} category={currentCategory} updateCategory={updateCategory} setScreen={setScreen} currentMatchId={currentMatchId} setCurrentMatchId={setCurrentMatchId} />;
      case 'RESULTS_VIEWER':
        if (!currentEvent || !currentCategory) { setScreen('HOME'); return null; }
        return <ResultsViewer event={currentEvent} category={currentCategory} setScreen={setScreen} />;
      default:
        return <div>Pantalla Desconocida</div>;
    }
  };

  return (
    <div className="antialiased min-h-screen bg-white dark:bg-[#0e1424] text-slate-900 dark:text-white transition-colors duration-300 selection:bg-blue-500/30">
        {renderScreen()}
        
        {/* Pyramid Import Modal */}
        {currentEvent && (
          <PyramidImportModal
            isOpen={showPyramidImportModal}
            event={currentEvent}
            onImportSuccess={(updatedEvent) => {
              updateEvent(updatedEvent);
              setShowPyramidImportModal(false);
            }}
            onClose={() => setShowPyramidImportModal(false)}
          />
        )}
    </div>
  );
}