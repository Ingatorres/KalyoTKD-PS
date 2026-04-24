import React, { useState } from 'react';

interface ActivationScreenProps {
  onActivate: (expirationDate: Date) => void;
}

const ACTIVATION_CODE = 'KalyoTkd@2025';
const TIME_PIN = 'Admin2025';

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivate }) => {
  const [stage, setStage] = useState('activation'); // 'activation', 'time_pin'
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ACTIVATION_CODE) {
      setStage('time_pin');
      setError('');
    } else {
      setError('Código de activación inválido.');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === TIME_PIN) {
      setStage('set_duration');
      setError('');
    } else {
      setError('PIN de tiempo incorrecto.');
    }
  };

  const [expirationDate, setExpirationDate] = useState('');

  const handleActivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (expirationDate) {
      // Ensure the date is interpreted correctly in local time zone
      const date = new Date(expirationDate);
      const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      onActivate(utcDate);
    } else {
      setError('Por favor, seleccione una fecha de expiración.');
    }
  };

  const renderStage = () => {
    switch (stage) {
      case 'activation':
        return (
          <form onSubmit={handleCodeSubmit}>
            <p className="text-gray-600 mb-6">Activación de la Aplicación</p>
            <input
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              placeholder="Ingrese el Código de Activación"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 mt-4">
              Siguiente
            </button>
          </form>
        );
      case 'time_pin':
        return (
          <form onSubmit={handlePinSubmit}>
            <p className="text-gray-600 mb-6">Ingrese el PIN de Tiempo</p>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              placeholder="PIN de Tiempo"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 mt-4">
              Habilitar Duración
            </button>
          </form>
        );
      case 'set_duration':
        return (
          <form onSubmit={handleActivation}>
            <p className="text-gray-600 mb-6">Seleccione la fecha de expiración</p>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button type="submit" className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-300 mt-4">
              Activar
            </button>
          </form>
        );
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="p-8 bg-white shadow-lg rounded-lg max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold mb-2">
          <span className="text-blue-600">Kalyo</span> <span className="text-red-600">TKD</span>
        </h1>
        {renderStage()}
      </div>
    </div>
  );
};