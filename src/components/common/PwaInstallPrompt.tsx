import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    const dismissed = sessionStorage.getItem('donezy_pwa_prompt_dismissed');
    if (dismissed) {
      return;
    }

    // Android/Chrome install event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari detection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice && !isStandalone) {
      setIsIos(true);
      setShowPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('donezy_pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-brand-200 dark:border-brand-900/60 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
      <div className="flex items-center gap-3">
        <img
          src="/pwa-192x192.png"
          alt="Donezy App Icon"
          className="w-11 h-11 rounded-2xl shadow-md shadow-brand-500/30 object-cover shrink-0"
        />
        <div className="text-left">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Install Donezy</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold">
              PWA
            </span>
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isIos ? (
              <span>Tap <Share className="w-3 h-3 inline text-brand-600" /> Share then <strong>"Add to Home Screen"</strong></span>
            ) : (
              'Fast offline launch & native home screen feel.'
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {!isIos && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 hover:from-brand-500 hover:to-accent-400 text-white font-bold text-xs shrink-0 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss prompt"
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
