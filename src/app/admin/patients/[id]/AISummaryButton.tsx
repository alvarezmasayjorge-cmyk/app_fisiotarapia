'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AISummaryButton({ patientId }: { patientId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      });
      if (!res.ok) throw new Error('Failed to generate summary');
      const data = await res.json();
      setSummary(data.summary);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-4">
      {!summary && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-indigo-200 rounded-xl shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-500" />}
          {loading ? 'Generando resumen...' : 'Generar Resumen con IA'}
        </button>
      )}

      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mt-2 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-indigo-900">Análisis de IA</h4>
            </div>
            <p className="text-sm text-indigo-800 whitespace-pre-wrap leading-relaxed">{summary}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-red-500 text-xs mt-2 text-center">Error al conectar con la IA.</p>}
    </div>
  );
}
