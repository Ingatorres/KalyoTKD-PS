import React from 'react';
import kalyoLogo from '../../src/KalyoTKD.svg';

export const IdleScreen: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Logo */}
      <div className="relative z-10 animate-fadeInScale">
        <img 
          src={kalyoLogo} 
          alt="Kalyo TKD Logo" 
          className="w-64 md:w-96 mb-12 drop-shadow-2xl animate-float" 
        />
      </div>

      {/* Title */}
      <div className="text-center relative z-10 animate-fadeInUp">
        <h1 className="text-7xl md:text-9xl font-black tracking-tight mb-4">
          <span className="text-white drop-shadow-lg">Kalyo </span>
          <span className="text-red-600 drop-shadow-lg animate-pulse">TKD</span>
        </h1>
        <p className="text-4xl md:text-5xl text-gray-300 font-light tracking-widest mt-6">
          Poomsaes Scoring
        </p>
      </div>

      {/* Subtle bottom indicator */}
      <div className="absolute bottom-8 text-center text-gray-500 text-lg animate-fadeIn" style={{ animationDelay: '2s' }}>
        <p>Sistema de Puntuación Profesional</p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-fadeInScale {
          animation: fadeInScale 1s ease-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out 0.3s both;
        }
        .animate-fadeIn {
          animation: fadeIn 1.5s ease-out both;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
