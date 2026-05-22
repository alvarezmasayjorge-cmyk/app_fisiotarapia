'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, Play, AlertCircle, Flame, X, Calendar, Apple, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import ProgressChart from '../admin/patients/[id]/ProgressChart';

type ExerciseItem = {
  id: string;
  isCompleted: boolean;
  exercise: {
    name: string;
    sets: number | null;
    reps: number | null;
    imageUrl: string | null;
    videoUrl: string | null;
  };
};

type ChartData = {
  date: string;
  cumplimiento: number;
  dolor: number | null;
};

export default function PatientDashboardClient({ 
  initialExercises,
  restrictionsCount,
  currentStreak,
  painLevelRecorded,
  nextAppointmentDate,
  chartData,
  nutritionItems
}: { 
  initialExercises: ExerciseItem[],
  restrictionsCount: number,
  currentStreak: number,
  painLevelRecorded: boolean,
  nextAppointmentDate: string | null,
  chartData: ChartData[],
  nutritionItems: any[]
}) {
  const router = useRouter();
  const [exercises, setExercises] = useState(initialExercises);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  
  // Modals
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [showPainModal, setShowPainModal] = useState(false);
  const [painSubmitting, setPainSubmitting] = useState(false);
  const [painLevel, setPainLevel] = useState<number>(5);

  const totalExercises = exercises.length;
  const completedExercises = exercises.filter(e => e.isCompleted).length;
  const progressPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  // Show pain modal when hitting 100% if not already recorded
  useEffect(() => {
    if (progressPercentage === 100 && !painLevelRecorded && !showPainModal) {
      // Delay slightly so they see the 100% animation first
      const timer = setTimeout(() => setShowPainModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [progressPercentage, painLevelRecorded, showPainModal]);

  const toggleComplete = async (planExerciseId: string) => {
    if (loadingIds.has(planExerciseId)) return;
    
    // Optimistic UI update
    setExercises(prev => prev.map(e => 
      e.id === planExerciseId ? { ...e, isCompleted: !e.isCompleted } : e
    ));
    
    setLoadingIds(prev => new Set(prev).add(planExerciseId));

    try {
      const res = await fetch('/api/exercise-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planExerciseId })
      });

      if (!res.ok) {
        setExercises(prev => prev.map(e => e.id === planExerciseId ? { ...e, isCompleted: !e.isCompleted } : e));
      } else {
        router.refresh();
      }
    } catch {
      setExercises(prev => prev.map(e => e.id === planExerciseId ? { ...e, isCompleted: !e.isCompleted } : e));
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(planExerciseId);
        return next;
      });
    }
  };

  const handlePainSubmit = async () => {
    setPainSubmitting(true);
    try {
      await fetch('/api/progress-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ painLevel })
      });
      setShowPainModal(false);
      router.refresh(); // Update streak and painLevelRecorded
    } finally {
      setPainSubmitting(false);
    }
  };

  // Helper to extract YouTube ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header Info */}
      <div className="flex justify-between items-center px-1">
        <h1 className="text-xl font-bold text-slate-800">Mi Plan</h1>
        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full border border-orange-100 font-medium text-sm">
          <Flame className="w-4 h-4 fill-orange-500" />
          Racha: {currentStreak} días
        </div>
      </div>

      {/* Progreso del día */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center">
        <h2 className="text-slate-500 font-medium mb-2">Progreso de Hoy</h2>
        <div className="flex justify-center items-center gap-4">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-teal-500 transition-all duration-1000 ease-out" strokeWidth="3" strokeDasharray={`${progressPercentage}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute text-2xl font-bold text-slate-800">{progressPercentage}%</span>
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-slate-800">{completedExercises} / {totalExercises}</p>
            <p className="text-sm text-slate-500">Ejercicios completados</p>
          </div>
        </div>
      </div>

      {/* Alerta de Próxima Cita */}
      {nextAppointmentDate && (
        <Link href="/patient/calendar" className="block">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-sm">Próxima Consulta</h3>
              <p className="text-blue-700 text-sm mt-0.5">
                {new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(nextAppointmentDate))}
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Restricciones Críticas */}
      {restrictionsCount > 0 && (
        <Link href="/patient/restrictions" className="block">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800">Cuidado: Tienes restricciones</h3>
              <p className="text-red-600 text-sm mt-1">{restrictionsCount} actividades que NO debes hacer.</p>
            </div>
          </div>
        </Link>
      )}

      {/* Tips Nutricionales Rápidos */}
      {nutritionItems && nutritionItems.length > 0 && (
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-start gap-3">
          <Apple className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-green-800">Recuerda tu Nutrición</h3>
            <p className="text-green-700 text-sm mt-1 line-clamp-2">
              {nutritionItems[0].description} {nutritionItems.length > 1 && ` (+${nutritionItems.length - 1} más)`}
            </p>
            <Link href="/patient/plan" className="text-green-800 font-medium text-xs mt-2 inline-block hover:underline">
              Ver plan completo →
            </Link>
          </div>
        </div>
      )}

      {/* Ejercicios */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3 px-1">Tu Rutina</h2>
        <div className="space-y-3">
          {exercises.map((pe) => {
            const isCompleted = pe.isCompleted;
            const isLoading = loadingIds.has(pe.id);
            const ytId = pe.exercise.videoUrl ? getYouTubeId(pe.exercise.videoUrl) : null;
            
            return (
              <div key={pe.id} className={`bg-white p-4 rounded-2xl shadow-sm border transition-all ${isCompleted ? 'border-green-200 bg-green-50/30' : 'border-slate-100'}`}>
                <div className="flex gap-4 items-center">
                  <button 
                    onClick={() => ytId && setPlayingVideo(ytId)}
                    disabled={!ytId}
                    className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative group ${ytId ? 'bg-slate-800 cursor-pointer' : 'bg-slate-100'}`}
                  >
                    {ytId ? (
                      <>
                        <img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity" />
                        <Play className="w-6 h-6 text-white absolute" fill="currentColor" />
                      </>
                    ) : pe.exercise.imageUrl ? (
                      <img src={pe.exercise.imageUrl} alt={pe.exercise.name} className="w-full h-full object-cover" />
                    ) : (
                      <Play className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-bold transition-all ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{pe.exercise.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{pe.exercise.sets} series x {pe.exercise.reps} reps</p>
                  </div>
                  <button onClick={() => toggleComplete(pe.id)} disabled={isLoading} className={`shrink-0 p-2 transition-transform active:scale-95 ${isLoading ? 'opacity-50 cursor-wait' : ''}`}>
                    {isCompleted ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <Circle className="w-8 h-8 text-slate-300 hover:text-teal-500" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mi Evolución (Chart) */}
      {chartData.length > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" /> Mi Evolución
          </h2>
          <div className="pt-2">
            <ProgressChart data={chartData} />
          </div>
          <p className="text-xs text-slate-400 text-center mt-4">Mantén la constancia para ver cómo disminuye el dolor con el tiempo.</p>
        </div>
      )}

      {/* Video Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setPlayingVideo(null)} className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10">
            <X className="w-8 h-8" />
          </button>
          <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            <iframe 
              src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1`} 
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture" 
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Pain Feedback Modal */}
      {showPainModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-6 shadow-2xl transform animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">¡Rutina Completada!</h2>
              <p className="text-slate-500 text-sm mt-2">Dile a tu fisioterapeuta cómo te sentiste hoy para ajustar tu plan.</p>
            </div>
            
            <div className="space-y-4">
              <label className="block text-center font-medium text-slate-700">Nivel de dolor</label>
              <div className="flex justify-between items-end px-2">
                <span className="text-xs text-green-600 font-medium">Sin dolor (1)</span>
                <span className="text-2xl font-bold text-slate-800">{painLevel}</span>
                <span className="text-xs text-red-600 font-medium">Mucho (10)</span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={painLevel} 
                onChange={(e) => setPainLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            <button 
              onClick={handlePainSubmit}
              disabled={painSubmitting}
              className="w-full bg-teal-600 text-white font-medium py-3 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {painSubmitting ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
