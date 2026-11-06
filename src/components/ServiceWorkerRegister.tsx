'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export function ServiceWorkerRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Enregistrement du Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Blue 2.0 Service Worker enregistré avec succès:', reg.scope);
          })
          .catch((err) => {
            console.warn('Erreur enregistrement Service Worker:', err);
          });
      });
    }

    // Capture de l'événement d'installation PWA
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Afficher la bannière d'installation si pas encore installé
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Résultat installation:', outcome);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-sky-500/30 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-inner">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-sky-300">Avis Blue 2.0</p>
          <p className="text-xs text-slate-300">Installer l'application sur votre écran</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl shadow transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installer</span>
        </button>
        <button
          onClick={() => setShowInstallBanner(false)}
          className="p-1 text-slate-400 hover:text-white transition"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
