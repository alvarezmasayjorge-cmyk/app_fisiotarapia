"use client";

import { useEffect, useState } from "react";
import { X, Share, PlusSquare } from "lucide-react";

export default function GlobalInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default true para evitar parpadeos en servidor
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (standalone) return;

    const dismissed = localStorage.getItem("installPromptDismissed");

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS we show the banner manually if not dismissed
    if (isIosDevice && !dismissed) {
      // Retrasar un poco para que no sea intrusivo al instante
      setTimeout(() => setShowPrompt(true), 2000);
    }

    // Asegurar que el Service Worker está registrado
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIosInstructions(true);
      setShowPrompt(false);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosInstructions(false);
    localStorage.setItem("installPromptDismissed", "true");
  };

  if (!mounted || isStandalone) return null;

  return (
    <>
      {showPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white shadow-2xl rounded-2xl p-4 z-50 border border-amber-100 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
          <div className="flex flex-col">
            <p className="font-bold text-slate-800 text-sm">Instala la App</p>
            <p className="text-xs text-slate-500 mt-0.5">Acceso rápido y mejor experiencia.</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleInstall}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {showIosInstructions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-slate-800 mb-2">Instalar en iPhone</h3>
            <p className="text-slate-600 text-sm mb-6">
              Apple requiere estos 2 sencillos pasos para instalar la aplicación:
            </p>
            <ol className="space-y-4 text-sm text-slate-700 font-medium">
              <li className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-blue-500 bg-white shadow-sm p-2 rounded-xl border border-slate-100"><Share size={20} /></span>
                <span>1. Toca <strong>Compartir</strong> en la barra inferior.</span>
              </li>
              <li className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-600 bg-white shadow-sm p-2 rounded-xl border border-slate-100"><PlusSquare size={20} /></span>
                <span>2. Toca <strong>"Agregar a Inicio"</strong>.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIosInstructions(false)}
              className="w-full mt-6 bg-amber-50 text-amber-600 hover:bg-amber-100 py-3.5 rounded-xl font-bold transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
