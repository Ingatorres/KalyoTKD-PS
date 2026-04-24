import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center animate-fade-in-out">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-blue-600">Kalyo</span> <span className="text-red-600">TKD</span>
        </h1>
        <p className="text-xl text-gray-500 mt-2">Poomsaes Scoring</p>
      </div>
      <style>{`
        @keyframes fade-in-out {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fade-in-out {
          animation: fade-in-out 8s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};
