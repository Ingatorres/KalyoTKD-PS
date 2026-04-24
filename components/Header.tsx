
import React, { useEffect, useState } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export const Header: React.FC = () => {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
        if (storedTheme) {
            setTheme(storedTheme);
            if (storedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
             document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const reopenPublicWindow = async () => {
        const label = 'public';
        try {
            let publicWin = await WebviewWindow.getByLabel(label);
            if (publicWin) {
                await publicWin.unminimize();
                await publicWin.setFocus();
                await publicWin.show();
            } else {
                // Recreate if it doesn't exist (closed manually)
                publicWin = new WebviewWindow(label, {
                    url: 'public.html',
                    title: 'Kalyo TKD - Public Display',
                    width: 1024,
                    height: 768,
                    resizable: true,
                    fullscreen: true
                });
            }
        } catch (error) {
            console.error("Error handling public window:", error);
            // Fallback for creation if getByLabel fails unexpectedly
             new WebviewWindow(label, {
                url: 'public.html',
                title: 'Kalyo TKD - Public Display',
                width: 1024,
                height: 768,
                resizable: true,
                fullscreen: true
            });
        }
    };

    return (
        <header className="py-6 px-6 relative z-50 flex items-center justify-between">
            <div className="flex-1 flex justify-start"></div> {/* Spacer Left */}
            
            <div className="flex-1 flex justify-center">
                <div className="group relative cursor-default">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                     <div className="relative px-7 py-4 bg-white dark:bg-black ring-1 ring-gray-900/5 rounded-lg leading-none flex items-top justify-start space-x-6 backdrop-blur-sm border border-slate-200 dark:border-white/10 shadow-xl">
                        <div className="space-y-2 text-center">
                            <p className="text-slate-800 dark:text-slate-100 font-black text-3xl tracking-tighter uppercase relative">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Kalyo</span>
                                <span className="ml-2 text-slate-900 dark:text-white">TKD</span>
                                <span className="absolute -top-1 -right-3 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                                </span>
                            </p>
                            <p className="text-xs text-slate-500 font-bold tracking-[0.3em] uppercase">Poomsaes Scoring</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex justify-end gap-3">
                <button 
                    onClick={reopenPublicWindow}
                    className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-md p-3 rounded-full border border-gray-200 dark:border-white/10 shadow-lg hover:scale-110 transition-transform text-slate-700 dark:text-blue-400 group"
                    title="Abrir/Restaurar Pantalla Pública"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-blue-500 transition-colors">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                </button>

                <button 
                    onClick={toggleTheme} 
                    className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-md p-3 rounded-full border border-gray-200 dark:border-white/10 shadow-lg hover:scale-110 transition-transform text-slate-700 dark:text-yellow-400 group"
                    title={theme === 'dark' ? "Cambiar a Modo Día" : "Cambiar a Modo Noche"}
                >
                    {theme === 'dark' ? (
                        // Sun Icon
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    ) : (
                        // Moon Icon
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 group-hover:-rotate-12 transition-transform"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                    )}
                </button>
            </div>
        </header>
    );
};
