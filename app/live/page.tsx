'use client';
import { useState, useEffect } from 'react';
import { Cast, RefreshCw, XCircle } from 'lucide-react';
import ExecutiveChart from '@/components/ExecutiveChart';

// Helper functions for Symbol Report
const timeToHours = (timeStr?: string) => {
  if (!timeStr || typeof timeStr !== 'string' || timeStr === '-') return 0;
  const cleanStr = timeStr.replace('.', ':').trim();
  if (!cleanStr.includes(':')) {
    const num = Number(cleanStr);
    return isNaN(num) ? 0 : num;
  }
  const [h, m] = cleanStr.split(':').map(Number);
  return (h || 0) + ((m || 0) / 60);
};

const getStatusSymbol = (log: any, emp: any, dataMap: any) => {
  if (!log) return 'x';

  let isPresent = false;
  const in1 = timeToHours(log.time_in_1);
  const out1 = timeToHours(log.time_out_1);
  const in2 = timeToHours(log.time_in_2);
  const out2 = timeToHours(log.time_out_2);
  const in3 = timeToHours(log.time_in_3);
  const out3 = timeToHours(log.time_out_3);

  if (in1 > 0 || out1 > 0 || in2 > 0 || out2 > 0 || in3 > 0 || out3 > 0) {
    isPresent = true;
  }

  if (!isPresent) {
    if (log.remark && log.remark.trim() !== '') return log.remark;
    return 'x';
  }

  const payMulti = log.pay_multiplier || 1.0;
  if (payMulti >= 2.0) {
    return '//';
  }

  let dailyOT = 0;
  const empShift = dataMap.shifts?.find((s: any) => s.id === emp.shift_id) || { ot_start_time: '18:30', time_in: '08:00' };
  const otSettingStart = timeToHours(dataMap.settings?.ot_in_end || empShift.ot_start_time);
  
  let isMissingPunch = false;
  const pairs = [[in1, out1], [in2, out2], [in3, out3]];
  pairs.forEach(([tIn, tOut]) => {
    if (tIn > 0 && tOut === 0) {
      isMissingPunch = true;
    }
    if (tIn > 0 && tOut > 0 && tOut > otSettingStart) {
      const actualOtStart = Math.max(tIn, otSettingStart);
      if (tOut > actualOtStart) {
        dailyOT += (tOut - actualOtStart);
      }
    }
  });

  let symbol = '/';

  const shiftStart = timeToHours(empShift.time_in || '08:00');
  if (in1 > 0 && in1 > shiftStart) {
    symbol = 'ส';
  }
  
  if (isMissingPunch) {
    symbol = symbol === '/' ? '?' : `${symbol}?`;
  }

  if (log.remark === 'นอกเวลา') {
    symbol = 'น';
  } else if (log.remark && log.remark.trim() !== '' && symbol === '/') {
    symbol = log.remark;
  }

  if (dailyOT > 0) {
    const otDisplay = dailyOT % 1 === 0 ? dailyOT.toString() : dailyOT.toFixed(1);
    if (symbol === '/') {
      symbol = `/${otDisplay}`;
    } else {
      symbol = `${symbol}/${otDisplay}`;
    }
  }

  return symbol;
};


export default function LivePresentationPage() {
  const [presentationState, setPresentationState] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchState = async () => {
    try {
      const res = await fetch('/api/presentation');
      const data = await res.json();
      if (data.success && data.data) {
        let payload = null;
        if (data.data.payload) {
          try {
            payload = JSON.parse(data.data.payload);
          } catch(e) {}
        }
        setPresentationState({ ...data.data, payload });
      } else {
        setPresentationState(null);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div className="flex h-screen items-center justify-center text-rose-500 font-bold bg-slate-900">เกิดข้อผิดพลาด: {error}</div>;
  }

  if (!presentationState || presentationState.is_active === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-900 text-white p-8">
        <Cast className="w-24 h-24 mb-6 text-slate-700 animate-pulse" />
        <h1 className="text-4xl font-black mb-4">โหมดนำเสนอ (Presentation Mode)</h1>
        <p className="text-xl text-slate-400 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" /> กำลังรอการแชร์หน้าจอจากผู้ดูแลระบบ...
        </p>
      </div>
    );
  }

  const renderSymbolReport = () => {
    const data = presentationState.payload;
    if (!data || !data.reportData) return null;
    const { reportData, startDate, endDate } = data;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center flex-wrap gap-2">
          <h2 className="font-bold text-slate-700 dark:text-slate-200">แสดงผลตั้งแต่วันที่ {startDate} ถึง {endDate} ({reportData.dates.length} วัน)</h2>
          <div className="flex gap-4 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="text-emerald-500 font-bold">/</span> เข้างานปกติ</span>
            <span className="flex items-center gap-1"><span className="text-indigo-500 font-bold">/3</span> ทำ OT</span>
            <span className="flex items-center gap-1"><span className="text-blue-500 font-bold">//</span> ทำงานวันหยุด (2แรง)</span>
            <span className="flex items-center gap-1"><span className="text-amber-500 font-bold">ส</span> มาสาย</span>
            <span className="flex items-center gap-1"><span className="text-fuchsia-500 font-bold">?</span> ลืมสแกน/สแกนไม่ครบ</span>
            <span className="flex items-center gap-1"><span className="text-rose-500 font-bold">x</span> ขาด/หยุด</span>
          </div>
        </div>
        
        <div className="overflow-x-auto max-h-[70vh] border-t border-slate-200 dark:border-slate-700">
          <table className="w-max min-w-full divide-y divide-slate-200 border-collapse text-xs table-fixed">
            <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0 z-40 shadow-sm">
              <tr>
                <th className="w-[50px] min-w-[50px] px-2 py-3 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 sticky left-0 z-50">ลำดับ</th>
                <th className="w-[80px] min-w-[80px] px-2 py-3 border border-slate-200 dark:border-slate-700 text-left font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 sticky left-[50px] z-50">รหัส</th>
                <th className="w-[180px] min-w-[180px] px-3 py-3 border border-slate-200 dark:border-slate-700 text-left font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 sticky left-[130px] z-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">ชื่อ-นามสกุล</th>
                
                {reportData.dates.map((date: string) => {
                  const dayNum = date.split('-')[2];
                  return (
                    <th key={date} className="w-[45px] min-w-[45px] px-1 py-3 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-200">
                      {dayNum}
                    </th>
                  );
                })}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800">
              {reportData.employees.map((emp: any, index: number) => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                  <td className="w-[50px] min-w-[50px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 text-center font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 sticky left-0 z-30">{index + 1}</td>
                  <td className="w-[80px] min-w-[80px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 sticky left-[50px] z-30">{emp.emp_code}</td>
                  <td className="w-[180px] min-w-[180px] px-3 py-2.5 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 sticky left-[130px] z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate">{emp.full_name}</td>
                  
                  {reportData.dates.map((date: string) => {
                    const key = `${emp.id}_${date}`;
                    const log = reportData.logsMap[key];
                    const statusDisplay = getStatusSymbol(log, emp, reportData);
                    
                    let textClass = 'text-slate-700 dark:text-slate-300 font-semibold';
                    let bgClass = '';
                    
                    if (statusDisplay === 'x') {
                      textClass = 'text-rose-500 dark:text-rose-400 font-bold';
                      bgClass = 'bg-rose-50/50 dark:bg-rose-900/20';
                    } else if (statusDisplay === '//') {
                      textClass = 'text-blue-600 dark:text-blue-400 font-extrabold';
                      bgClass = 'bg-blue-50/50 dark:bg-blue-900/20';
                    } else if (statusDisplay.includes('?')) {
                      textClass = 'text-fuchsia-600 dark:text-fuchsia-400 font-bold';
                      bgClass = 'bg-fuchsia-50/50 dark:bg-fuchsia-900/20';
                    } else if (statusDisplay.includes('ส')) {
                      textClass = 'text-amber-600 dark:text-amber-400 font-bold';
                      bgClass = 'bg-amber-50/50 dark:bg-amber-900/20';
                    } else if (statusDisplay.includes('/')) {
                      textClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
                      bgClass = 'bg-emerald-50/30 dark:bg-emerald-900/10';
                      if (statusDisplay !== '/') {
                         textClass = 'text-indigo-600 dark:text-indigo-400 font-extrabold';
                         bgClass = 'bg-indigo-50/50 dark:bg-indigo-900/20';
                      }
                    }

                    return (
                      <td key={date} className={`w-[45px] min-w-[45px] px-1 py-3 border border-slate-200 dark:border-slate-700 text-center text-sm ${textClass} ${bgClass}`}>
                        {statusDisplay}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 font-sans">
      <div className="max-w-[1600px] mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full animate-pulse">
              <Cast className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black">{presentationState.title || 'กำลังนำเสนอ'}</h2>
              <p className="text-indigo-200 mt-1 font-medium">JST Industry - Live Dashboard</p>
            </div>
          </div>
          <div className="text-indigo-200 text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {presentationState.view_mode === 'executive' && presentationState.payload && (
            <div className="h-[600px]">
              <ExecutiveChart 
                title={presentationState.title}
                data={presentationState.payload.chartData} 
                xKey="date" 
                series={[
                  { key: 'present', name: 'มาทำงานปกติ', color: '#10b981' },
                  { key: 'leave', name: 'ลา / มีปัญหา', color: '#eab308' },
                  { key: 'missingPunch', name: 'ลืมสแกนออก', color: '#f97316' },
                  { key: 'absent', name: 'หยุด / ขาดงาน', color: '#94a3b8' }
                ]}
              />
            </div>
          )}

          {presentationState.view_mode === 'symbol' && presentationState.payload && renderSymbolReport()}
        </div>

      </div>
    </div>
  );
}
