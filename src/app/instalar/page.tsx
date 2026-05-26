"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, PlusSquare, Smartphone, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Detect if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Register service worker to ensure PWA criteria are met
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(err => {
        console.error("Service Worker registration failed:", err);
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("App installed");
    }
    setDeferredPrompt(null);
  };

  if (!mounted) return null;

  if (isStandalone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6 border border-slate-100">
          <div className="mx-auto bg-green-100 text-green-600 p-4 rounded-full w-24 h-24 flex items-center justify-center mb-4">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">¡App Instalada!</h1>
          <p className="text-slate-600 font-medium">
            Ya tienes la aplicación instalada en tu dispositivo. Puedes cerrar esta página o iniciar sesión.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center mt-4 w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/30"
          >
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 sm:p-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-100 to-transparent -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute top-[20%] left-[-10%] w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="w-full max-w-md mt-4 sm:mt-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          <div className="p-8 text-center space-y-8">
            <div className="relative w-32 h-32 mx-auto shadow-2xl rounded-3xl overflow-hidden border-4 border-white bg-white">
              <Image 
                src="/logo.png" 
                alt="Sentirse Única Logo" 
                fill 
                className="object-cover"
                priority
              />
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Sentirse Única</h1>
              <p className="text-slate-500 mt-2 font-medium">Tu Plataforma de Rehabilitación</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 text-left border border-amber-100/50">
              <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-lg">
                <Smartphone size={22} className="text-amber-600" />
                Instala la App
              </h3>
              <p className="text-amber-800/80 text-sm leading-relaxed mb-6 font-medium">
                Accede rápidamente a tus ejercicios, seguimiento y citas con tu fisioterapeuta. Es segura y no ocupa espacio en tu dispositivo.
              </p>

              {isIOS ? (
                <div className="space-y-4">
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-amber-100/50 shadow-sm">
                    <p className="text-sm text-slate-800 font-bold mb-4">Para instalar en iPhone o iPad:</p>
                    <ol className="text-sm text-slate-600 space-y-4 font-medium">
                      <li className="flex items-center gap-4">
                        <span className="bg-blue-50 text-blue-600 p-2.5 rounded-xl shadow-sm border border-blue-100/50"><Share size={18} /></span>
                        <span>1. Toca el ícono <strong>Compartir</strong> abajo.</span>
                      </li>
                      <li className="flex items-center gap-4">
                        <span className="bg-slate-50 text-slate-700 p-2.5 rounded-xl shadow-sm border border-slate-200/50"><PlusSquare size={18} /></span>
                        <span>2. Selecciona <strong>"Agregar a Inicio"</strong>.</span>
                      </li>
                    </ol>
                  </div>
                </div>
              ) : deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all text-white py-4 px-6 rounded-xl font-bold shadow-xl shadow-amber-500/25 text-lg"
                >
                  <Download size={22} />
                  Instalar Ahora
                </button>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-amber-100/50 shadow-sm">
                  <p className="text-sm text-slate-800 font-bold mb-4">Para instalar en Android/PC:</p>
                  <ol className="text-sm text-slate-600 space-y-4 font-medium">
                    <li className="flex items-center gap-4">
                      <span className="bg-slate-50 text-slate-700 p-2.5 rounded-xl shadow-sm border border-slate-200/50 font-bold text-lg leading-none">⋮</span>
                      <span>1. Abre el menú del navegador.</span>
                    </li>
                    <li className="flex items-center gap-4">
                      <span className="bg-slate-50 text-slate-700 p-2.5 rounded-xl shadow-sm border border-slate-200/50"><Download size={18} /></span>
                      <span>2. Toca <strong>"Instalar aplicación"</strong>.</span>
                    </li>
                  </ol>
                  <p className="text-xs text-amber-700 mt-4 text-center bg-amber-100/50 py-2 rounded-lg font-medium">
                    Instala directamente desde el menú si el botón no aparece.
                  </p>
                </div>
              )}
            </div>

            <Link href="/login" className="inline-block mt-4 text-sm font-semibold text-slate-400 hover:text-amber-600 transition-colors underline underline-offset-4 decoration-transparent hover:decoration-amber-600">
              Continuar en el navegador sin instalar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
