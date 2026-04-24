
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Event, Judge, Screen } from '../types';
import { Header } from './Header';

interface NewEventScreenProps {
  addEvent: (event: Event) => void;
  setScreen: (screen: Screen) => void;
  setCurrentEventId: (id: string) => void;
}

export const NewEventScreen: React.FC<NewEventScreenProps> = ({ addEvent, setScreen, setCurrentEventId }) => {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [areaNumber, setAreaNumber] = useState(1);
  const [areaChief, setAreaChief] = useState('');
  const [registrarName, setRegistrarName] = useState('');
  const [numJudges, setNumJudges] = useState<3 | 5 | 7>(3);
  const [judges, setJudges] = useState<Judge[]>(Array(3).fill({ id: '', name: '' }).map(() => ({ id: uuidv4(), name: '' })));

  const handleNumJudgesChange = (numStr: string) => {
    const num = parseInt(numStr) as 3 | 5 | 7;
    setNumJudges(num);
    setJudges(Array(num).fill({ id: '', name: '' }).map(() => ({ id: uuidv4(), name: '' })));
  };

  const handleJudgeNameChange = (index: number, name: string) => {
    const newJudges = [...judges];
    newJudges[index].name = name;
    setJudges(newJudges);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: Event = {
      id: uuidv4(),
      name: eventName,
      date: eventDate,
      areaNumber,
      areaChief,
      registrarName,
      judges,
      categories: [],
      status: 'active',
    };
    addEvent(newEvent);
    setCurrentEventId(newEvent.id);
    setScreen('CATEGORY');
  };

    const inputStyles = "mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0e1424] transition-colors duration-300">
      <Header />
      <main className="max-w-2xl mx-auto py-8 px-4">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 space-y-6 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">Creación de Evento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título del Evento</label>
              <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} required className={inputStyles} />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required className={inputStyles} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Área</label>
              <input type="number" value={areaNumber} onChange={e => setAreaNumber(parseInt(e.target.value))} min="1" required className={inputStyles} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jefe de Área</label>
              <input type="text" value={areaChief} onChange={e => setAreaChief(e.target.value)} required className={inputStyles} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Registrador</label>
              <input type="text" value={registrarName} onChange={e => setRegistrarName(e.target.value)} required className={inputStyles} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Jueces</label>
              <select value={numJudges} onChange={e => handleNumJudgesChange(e.target.value)} className={`${inputStyles} bg-white`}>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="7">7</option>
              </select>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">Nombres de Jueces</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {judges.map((judge, index) => (
                <div key={judge.id}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Juez {index + 1}</label>
                  <input type="text" value={judge.name} onChange={e => handleJudgeNameChange(index, e.target.value)} required className={inputStyles} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
             <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition duration-300">
              Crear Evento
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
