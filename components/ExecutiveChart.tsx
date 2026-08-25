'use client';
import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Table as TableIcon, MousePointerClick } from 'lucide-react';

interface ChartData {
  [key: string]: any;
}

interface ExecutiveChartProps {
  title: string;
  data: ChartData[];
  xKey: string;
  series: { key: string; name: string; color: string }[];
  onDataClick?: (date: string, key: string) => void;
}

export default function ExecutiveChart({ title, data, xKey, series, onDataClick }: ExecutiveChartProps) {
  const [viewMode, setViewMode] = useState<'bar' | 'line' | 'table'>('bar');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col h-[400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
            {title}
          </h3>
          {onDataClick && viewMode === 'bar' && (
             <p className="text-xs text-indigo-500 font-medium mt-1 flex items-center">
               <MousePointerClick className="w-3 h-3 mr-1" /> คลิกที่แท่งกราฟเพื่อดูรายชื่อพนักงาน
             </p>
          )}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('bar')}
            className={`p-1.5 rounded-md transition ${viewMode === 'bar' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            title="Bar Chart"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('line')}
            className={`p-1.5 rounded-md transition ${viewMode === 'line' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            title="Line Chart"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            title="Data Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full overflow-hidden">
        {viewMode === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {series.map((s) => (
                <Bar 
                  key={s.key} 
                  dataKey={s.key} 
                  name={s.name} 
                  fill={s.color} 
                  radius={[4, 4, 0, 0]} 
                  onClick={(payload) => {
                    if (onDataClick && payload && payload[xKey]) {
                      onDataClick(payload[xKey], s.key);
                    }
                  }}
                  cursor={onDataClick ? 'pointer' : 'default'}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'line' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {series.map((s) => (
                <Line 
                  key={s.key} 
                  type="monotone" 
                  dataKey={s.key} 
                  name={s.name} 
                  stroke={s.color} 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ 
                    r: 6,
                    onClick: (_event, payload) => {
                       if (onDataClick && payload?.payload && payload.payload[xKey]) {
                         onDataClick(payload.payload[xKey], s.key);
                       }
                    } 
                  }} 
                  style={{ cursor: onDataClick ? 'pointer' : 'default' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'table' && (
          <div className="h-full overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">วันที่ / หมวดหมู่</th>
                  {series.map((s) => (
                    <th key={s.key} className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{row[xKey]}</td>
                    {series.map((s) => (
                      <td 
                        key={s.key} 
                        className={`px-4 py-3 text-right ${onDataClick ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : ''}`}
                        onClick={() => {
                          if (onDataClick) onDataClick(row[xKey], s.key);
                        }}
                      >
                        <span className="text-slate-600 dark:text-slate-400">
                          {row[s.key] !== undefined ? row[s.key] : '-'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
