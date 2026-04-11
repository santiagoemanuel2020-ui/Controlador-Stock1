'use client';

import { useState, useEffect } from 'react';

// Define the BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  readonly prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [instructions, setInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also show manual instructions after a few seconds
    const timer = setTimeout(() => {
      if (!showButton) {
        setInstructions(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [showButton]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowButton(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return null;
  }

  // Show automatic install button if available
  if (showButton) {
    return (
      <button
        onClick={handleInstall}
        className="fixed bottom-4 right-4 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Instalar App
      </button>
    );
  }

  // Show manual instructions if automatic not available
  if (instructions || !showButton) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setInstructions(!instructions)}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          ¿Cómo instalar?
        </button>
        
        {instructions && (
          <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-xl p-4 w-64 text-sm text-slate-700 border border-slate-200">
            <p className="font-semibold mb-2">Para instalar:</p>
            <ul className="space-y-1 text-slate-600">
              <li><strong>Celular:</strong> Menú → Agregar a pantalla de inicio</li>
              <li><strong>PC:</strong> A la derecha de la URL, click en el ícono de instalar</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  return null;
}