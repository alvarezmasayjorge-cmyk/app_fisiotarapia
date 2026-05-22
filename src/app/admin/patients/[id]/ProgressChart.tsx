'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ChartData = {
  date: string;
  cumplimiento: number;
  dolor: number | null;
};

export default function ProgressChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-400">Sin datos suficientes para graficar.</p>;

  // Convert dates to shorter format
  const formattedData = data.map(d => ({
    ...d,
    date: new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(d.date))
  })).reverse(); // Reverse to show oldest to newest left to right

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{fontSize: 12, fill: '#94a3b8'}} />
          <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#14b8a6'}} domain={[0, 100]} />
          <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#f97316'}} domain={[0, 10]} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="cumplimiento" 
            name="% Cumplido" 
            stroke="#14b8a6" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6 }} 
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="dolor" 
            name="Nivel Dolor" 
            stroke="#f97316" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
