import React, { useEffect, useState } from 'react';

interface PyramidWinnerScreenProps {
  winner: 'blue' | 'red' | 'tie';
  competitorName: string;
  competitorDelegation?: string;
  finalScore?: number;
  techAvg?: number;
  presAvg?: number;
  modality?: string;
}

export const PyramidWinnerScreen: React.FC<PyramidWinnerScreenProps> = ({ winner, competitorName, competitorDelegation, finalScore, techAvg, presAvg, modality }) => {
  const [phase, setPhase] = useState<'deliberation' | 'announcement'>('deliberation');

  useEffect(() => {
    // Phase 1: Deliberation/Tension (3 seconds)
    const timer = setTimeout(() => {
      setPhase('announcement');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (phase === 'deliberation') {
    return <DeliberationPhase />;
  }

  return <WinnerAnnouncement winner={winner} competitorName={competitorName} competitorDelegation={competitorDelegation} finalScore={finalScore} techAvg={techAvg} presAvg={presAvg} modality={modality} />;
};

// Phase 1: Cinematic Tension / Judges Deliberating (UNCHANGED - User Loved It)
const DeliberationPhase: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black opacity-80"></div>
      
      {/* Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-blue-900/20 via-transparent to-transparent animate-pulse-slow"></div>

      {/* Central Pulse */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-12">
            {/* Outer Ring */}
            <div className="absolute inset-0 border-4 border-t-transparent border-b-transparent border-l-blue-500 border-r-red-500 rounded-full w-48 h-48 animate-spin-fast blur-sm"></div>
            <div className="absolute inset-0 border-4 border-t-blue-500 border-b-red-500 border-l-transparent border-r-transparent rounded-full w-48 h-48 animate-spin-reverse blur-sm"></div>
            
            {/* Inner Icon/Graphic */}
            <div className="w-48 h-48 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-full border-2 border-gray-700 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
            </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-white to-gray-200 tracking-[0.2em] animate-fade-in-up drop-shadow-lg">
            DECISIÓN
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mt-4 font-light tracking-widest uppercase animate-pulse">
            Procesando Resultados...
        </p>
      </div>
      
      <style>{`
        @keyframes spinFast {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .animate-spin-fast {
            animation: spinFast 1s linear infinite;
        }
        @keyframes spinReverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
            animation: spinReverse 1.5s linear infinite;
        }
        @keyframes pulseSlow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
        }
        .animate-pulse-slow {
            animation: pulseSlow 3s ease-in-out infinite;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Phase 2: Winner Announcement (Dark Cinematic Redesign - Intense Colors)
const WinnerAnnouncement: React.FC<PyramidWinnerScreenProps> = ({ winner, competitorName, competitorDelegation, finalScore, techAvg, presAvg, modality }) => {
  const isBlue = winner === 'blue';
  
  const isTeamEvent = modality?.toLowerCase().includes('pareja') || modality?.toLowerCase().includes('equipo') || modality?.toLowerCase().includes('trio');
  const displayTitle = isTeamEvent && competitorDelegation ? competitorDelegation : competitorName;
  const displaySubtitle = isTeamEvent && competitorDelegation ? competitorName : null;
  
  // Theme Colors (Neon/Glow) - INTENSIFIED
  const neonColor = isBlue ? 'text-blue-500' : 'text-red-500';
  const glowColor = isBlue ? 'shadow-blue-500/80' : 'shadow-red-500/80'; // Increased opacity
  const borderColor = isBlue ? 'border-blue-400' : 'border-red-400'; // Brighter border
  
  // Much more intense spotlight
  const spotlightGradient = isBlue 
    ? 'from-blue-600/80 via-blue-800/40 to-transparent' 
    : 'from-red-600/80 via-red-800/40 to-transparent';
    
  const particleColor = isBlue ? 'bg-blue-400' : 'bg-red-400';

  const winnerText = isBlue ? 'CHONG' : 'HONG';
  const winnerLabelColor = isBlue ? 'text-blue-400' : 'text-red-400';

  return (
    <div className="h-screen w-screen bg-black flex flex-col justify-center items-center text-white overflow-hidden relative">
      
      {/* 1. Cinematic Spotlight Background - INTENSIFIED */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-[130%] bg-gradient-to-b ${spotlightGradient} opacity-0 animate-spotlight-on`}></div>
      
      {/* 2. Ambient Glow (Floor) - INTENSIFIED */}
      <div className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t ${isBlue ? 'from-blue-600/40' : 'from-red-600/40'} to-transparent opacity-80`}></div>

      {/* 3. Rotating Neon Rings (Subtle Background) - BRIGHTER */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
         <div className={`w-[90vw] h-[90vw] border-[2px] border-dashed ${isBlue ? 'border-blue-500' : 'border-red-500'} rounded-full animate-spin-slow`}></div>
         <div className={`absolute w-[70vw] h-[70vw] border-[2px] border-dotted ${isBlue ? 'border-blue-400' : 'border-red-400'} rounded-full animate-spin-reverse-slow`}></div>
      </div>

      {/* 4. Particles (Embers/Sparks) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
         {[...Array(40)].map((_, i) => (
            <div 
                key={i}
                className={`absolute w-1 h-1 md:w-3 md:h-3 ${particleColor} rounded-full blur-[1px] box-shadow-[0_0_10px_currentColor]`}
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `100%`,
                    animation: `riseParticle ${2 + Math.random() * 3}s ease-out infinite`,
                    animationDelay: `${Math.random() * 2}s`
                }}
            />
         ))}
      </div>

      {/* 5. Content Container */}
      <div className="relative z-20 flex flex-col items-center justify-center transform scale-100 md:scale-110">
          
          {/* TROPHY REMOVED AS REQUESTED */}

          {/* Winner Text - Metallic & Neon */}
          <h1 className="text-7xl md:text-9xl font-black mb-12 tracking-tighter animate-zoom-in drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-100 to-gray-400">
                ¡GANADOR!
            </span>
          </h1>
          
          {/* Name Card - Dark Glass with Neon Border */}
          <div className={`relative bg-black/40 backdrop-blur-2xl px-24 py-12 rounded-3xl border-2 ${borderColor} ${glowColor} shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-slide-up overflow-hidden group`}>
            {/* Intense sheen effect */}
            <div className={`absolute inset-0 bg-gradient-to-tr ${isBlue ? 'from-blue-500/20' : 'from-red-500/20'} to-transparent opacity-60 pointer-events-none`}></div>
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-45 translate-x-[-100%] animate-shine"></div>

            <h2 className={`text-6xl md:text-8xl font-black uppercase tracking-[0.2em] text-center mb-6 ${winnerLabelColor} drop-shadow-[0_0_15px_currentColor]`}>
                {winnerText}
            </h2>
            
            <div className={`h-2 w-48 mx-auto bg-gradient-to-r from-transparent ${isBlue ? 'via-blue-400' : 'via-red-400'} to-transparent mb-8 rounded-full opacity-100 shadow-[0_0_10px_currentColor]`}></div>
            
            <p className={`text-5xl md:text-7xl font-bold text-center text-white tracking-wide drop-shadow-xl ${finalScore !== undefined && !displaySubtitle ? 'mb-8' : ''}`}>
                {displayTitle}
            </p>
            {displaySubtitle && (
                 <p className={`text-xl md:text-2xl font-semibold text-center text-gray-300 tracking-wider mt-4 drop-shadow-md ${finalScore !== undefined ? 'mb-8' : ''}`}>
                    {displaySubtitle}
                 </p>
            )}

            {finalScore !== undefined && (
                <div className="flex justify-center items-center gap-8 mt-6 pt-8 border-t border-white/20 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Técnica</p>
                        <p className={`text-3xl font-black ${winnerLabelColor} drop-shadow-md`}>{techAvg?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className={`text-center px-8 border-x border-white/10`}>
                        <p className="text-xs text-white uppercase tracking-widest mb-1 font-bold opacity-80">Puntaje Final</p>
                        <p className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">{(finalScore || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Present.</p>
                        <p className={`text-3xl font-black ${winnerLabelColor} drop-shadow-md`}>{presAvg?.toFixed(2) || '0.00'}</p>
                    </div>
                </div>
            )}
          </div>
      </div>

      <style>{`
        @keyframes spotlightOn {
            0% { opacity: 0; transform: translate(-50%, -10%) scale(0.8); }
            100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        .animate-spotlight-on {
            animation: spotlightOn 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes riseParticle {
            0% { transform: translateY(0) scale(1); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }
        @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spinSlow 30s linear infinite;
        }
        @keyframes spinReverseSlow {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
        }
        .animate-spin-reverse-slow {
            animation: spinReverseSlow 25s linear infinite;
        }
        @keyframes zoomIn {
            0% { transform: scale(0.9); opacity: 0; filter: blur(10px); }
            100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        .animate-zoom-in {
            animation: zoomIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
            opacity: 0;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }
        .animate-float {
            animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
