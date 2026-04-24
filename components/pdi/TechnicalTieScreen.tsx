import React from 'react';
import { PdiTechnicalTieData } from '../../types';
import kalyoLogo from '../../src/KalyoTKD.svg';

export const TechnicalTieScreen: React.FC<PdiTechnicalTieData> = ({ categoryTitle, position, competitors }) => {
  if (!competitors) {
    return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white font-black uppercase tracking-widest">Cargando...</div>;
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Cinematic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
        </div>

        <div className="w-full max-w-6xl bg-white/5 backdrop-blur-2xl rounded-[40px] shadow-[0_0_100px_rgba(234,179,8,0.1)] p-16 border-2 border-yellow-500/30 relative z-10 overflow-hidden group">
            {/* Logo and Header */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center space-x-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <img src={kalyoLogo} className="h-10 w-auto" alt="Logo" />
                <div className="w-px h-6 bg-yellow-500/30"></div>
                <span className="text-yellow-500 font-black tracking-[0.3em] text-[10px] uppercase">Kalyo TKD</span>
            </div>
            
            {/* Animated accent border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
            
            <div className="text-center space-y-6 pt-12">
                <div className="inline-block bg-yellow-500 text-black px-8 py-2 rounded-full text-xs font-black tracking-[0.5em] uppercase mb-4 animate-bounce">
                    Alerta de Sistema
                </div>
                
                <h1 className="text-9xl font-black text-yellow-400 text-center tracking-tighter uppercase leading-none drop-shadow-[0_10px_30px_rgba(234,179,8,0.3)]">
                    EMPATE <br/> <span className="text-white">TÉCNICO</span>
                </h1>
                
                <div className="h-px w-32 bg-yellow-500/50 mx-auto my-8"></div>
                
                <h2 className="text-4xl font-bold text-center text-slate-300 tracking-wide uppercase italic opacity-80">{categoryTitle}</h2>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-8 my-10 backdrop-blur-md">
                    <p className="text-3xl text-center text-yellow-100 font-medium">
                        Se ha detectado igualdad total en <span className="text-yellow-400 font-black">Puntaje Final</span> y <span className="text-yellow-400 font-black">Presentación</span>.
                    </p>
                    <p className="text-4xl mt-6 text-center text-white font-black uppercase tracking-widest animate-pulse">
                         REALIZAR NUEVO POOMSAE
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-8 items-center justify-center">
                    {competitors.map((c, index) => (
                        <div key={index} className="bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col items-center">
                             <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black text-2xl mb-4 shadow-lg shadow-yellow-500/20">
                                {c.name.charAt(0)}
                             </div>
                             <p className="text-4xl font-black text-white uppercase tracking-tight">
                                {c.name}
                            </p>
                            <p className="text-sm font-bold text-yellow-500/60 uppercase tracking-widest mt-2">
                                {c.delegation}
                            </p>
                        </div>
                    ))}
                </div>
                
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em] mt-12">
                    Sorteando nueva forma &bull; Preparación en curso
                </p>
            </div>
        </div>
    </div>
  );
};
