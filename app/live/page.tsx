'use client';
import { useState, useEffect } from 'react';
import { Cast, RefreshCw, XCircle } from 'lucide-react';
import ExecutiveChart from '@/components/ExecutiveChart';
import { ROUTES } from '@/lib/routes';

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

const getStatusData = (log: any, emp: any, dataMap: any) => {
  if (!log) return { isAbsent: true, text: 'x', isRemark: false, timeText: '', isLate: false, isMissingPunch: false, dailyOT: 0, isDoublePay: false, remark: '' };

  let isPresent = false;
  const in1 = timeToHours(log.time_in_1);
  const out1 = timeToHours(log.time_out_1);
  const in2 = timeToHours(log.time_in_2);
  const out2 = timeToHours(log.time_out_2);
  const in3 = timeToHours(log.time_in_3);
  const out3 = timeToHours(log.time_out_3);

  if (in1 > 0 || out1 > 0 || in2 > 0 || out2 > 0 || in3 > 0 || out3 > 0) isPresent = true;

  if (!isPresent) {
    if (log.remark && log.remark.trim() !== '') return { isAbsent: true, text: log.remark, isRemark: true, timeText: '', isLate: false, isMissingPunch: false, dailyOT: 0, isDoublePay: false, remark: log.remark };
    return { isAbsent: true, text: 'x', isRemark: false, timeText: '', isLate: false, isMissingPunch: false, dailyOT: 0, isDoublePay: false, remark: '' };
  }

  const payMulti = log.pay_multiplier || 1.0;
  const isDoublePay = payMulti >= 2.0;

  let dailyOT = 0;
  const empShift = dataMap.shifts?.find((s: any) => s.id === emp.shift_id) || { ot_start_time: '18:30', time_in: '08:00' };
  const otSettingStart = timeToHours(dataMap.settings?.ot_in_end || empShift.ot_start_time);
  
  let isMissingPunch = false;
  const pairs = [[in1, out1], [in2, out2], [in3, out3]];
  pairs.forEach(([tIn, tOut]) => {
    if (tIn > 0 && tOut === 0) isMissingPunch = true;
    if (tIn > 0 && tOut > 0 && tOut > otSettingStart) {
      const actualOtStart = Math.max(tIn, otSettingStart);
      if (tOut > actualOtStart) dailyOT += (tOut - actualOtStart);
    }
  });

  const shiftStart = timeToHours(empShift.time_in || '08:00');
  const isLate = in1 > 0 && in1 > shiftStart;
  
  let timeText = log.time_in_1 && log.time_in_1 !== '-' ? log.time_in_1 : (log.time_in_2 && log.time_in_2 !== '-' ? log.time_in_2 : '?');

  return { isAbsent: false, text: timeText, timeText, isLate, isMissingPunch, dailyOT, isDoublePay, remark: log.remark, isRemark: false };
};

const getDetailedLines = (log: any) => {
  if (!log) return ['x'];
  const lines: string[] = [];
  if (log.time_in_1 || log.time_out_1) lines.push(`${log.time_in_1 || '?'} - ${log.time_out_1 || '?'}`);
  if (log.time_in_2 || log.time_out_2) lines.push(`${log.time_in_2 || '?'} - ${log.time_out_2 || '?'}`);
  if (log.time_in_3 || log.time_out_3) lines.push(`(OT) ${log.time_in_3 || '?'} - ${log.time_out_3 || '?'}`);
  if (lines.length === 0) {
    if (log.remark && log.remark.trim() !== '') return [log.remark];
    return ['x'];
  }
  if (log.remark && log.remark.trim() !== '') lines.push(`[${log.remark}]`);
  return lines;
};

export default function LivePresentationPage() {
  const [presentationState, setPresentationState] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchState = async () => {
    try {
      const res = await fetch(ROUTES.API.PRESENTATION);
      const data = await res.json();
      if (data.success && data.data) {
        let payload = data.data.payload;
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
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
                <th className="w-[60px] min-w-[60px] px-2 py-3 border border-slate-200 dark:border-slate-700 text-center font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20">ทำงาน<br/>(วัน)</th>
                <th className="w-[60px] min-w-[60px] px-2 py-3 border border-slate-200 dark:border-slate-700 text-center font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20">ลา<br/>(วัน)</th>
                <th className="w-[60px] min-w-[60px] px-2 py-3 border border-slate-200 dark:border-slate-700 text-center font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">รวม OT<br/>(ชม.)</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800">
              {reportData.employees.map((emp: any, index: number) => {
                let totalWorkDays = 0;
                let totalLeaveDays = 0;
                let totalOT = 0;

                return (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                  <td className="w-[50px] min-w-[50px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 text-center font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 sticky left-0 z-30">{index + 1}</td>
                  <td className="w-[80px] min-w-[80px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 sticky left-[50px] z-30">{emp.emp_code}</td>
                  <td className="w-[180px] min-w-[180px] px-3 py-2.5 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 sticky left-[130px] z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate">{emp.full_name}</td>
                  
                  {reportData.dates.map((date: string) => {
                    const key = `${emp.id}_${date}`;
                    const log = reportData.logsMap[key];
                    const dataObj = getStatusData(log, emp, reportData);
                    
                    if (!dataObj.isAbsent && dataObj.timeText) totalWorkDays += 1;
                    if (dataObj.isAbsent && dataObj.isRemark) totalLeaveDays += 1;
                    if (dataObj.dailyOT > 0) totalOT += dataObj.dailyOT;

                    let bgClass = '';
                    if (dataObj.isAbsent) {
                      bgClass = dataObj.isRemark ? 'bg-amber-50/50 dark:bg-amber-900/20' : 'bg-rose-50/50 dark:bg-rose-900/20';
                    } else if (dataObj.isMissingPunch) {
                      bgClass = 'bg-fuchsia-50/50 dark:bg-fuchsia-900/20';
                    } else if (dataObj.isLate) {
                      bgClass = 'bg-rose-50/30 dark:bg-rose-900/10';
                    } else {
                      bgClass = 'bg-emerald-50/20 dark:bg-emerald-900/10';
                    }

                    return (
                      <td key={date} className={`w-[60px] min-w-[60px] px-1 py-1 border border-slate-200 dark:border-slate-700 text-center text-xs leading-tight ${bgClass}`}>
                        {dataObj.isAbsent ? (
                          <div className={`font-bold ${dataObj.isRemark ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>
                            {dataObj.text}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className={`font-bold ${dataObj.isLate ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {dataObj.timeText}
                            </div>
                            {dataObj.dailyOT > 0 && (
                              <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                                OT {dataObj.dailyOT.toFixed(1)} ชม.
                              </div>
                            )}
                            {dataObj.isDoublePay && (
                              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                2 แรง
                              </div>
                            )}
                            {dataObj.isMissingPunch && (
                              <div className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400">
                                ?
                              </div>
                            )}
                            {dataObj.remark && dataObj.remark !== 'นอกเวลา' && (
                              <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate w-full" title={dataObj.remark}>
                                [{dataObj.remark}]
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="w-[60px] min-w-[60px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 text-center font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10">{totalWorkDays}</td>
                  <td className="w-[60px] min-w-[60px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 text-center font-bold text-amber-600 bg-amber-50/50 dark:bg-amber-900/10">{totalLeaveDays}</td>
                  <td className="w-[60px] min-w-[60px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 text-center font-bold text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10">{totalOT > 0 ? totalOT.toFixed(1) : '-'}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDetailedReport = () => {
    const data = presentationState.payload;
    if (!data || !data.reportData) return null;
    const { reportData, startDate, endDate } = data;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center flex-wrap gap-2">
          <h2 className="font-bold text-slate-700 dark:text-slate-200">แสดงผลตั้งแต่วันที่ {startDate} ถึง {endDate} ({reportData.dates.length} วัน)</h2>
          <div className="flex gap-4 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="text-rose-500 font-bold">x</span> ขาด/หยุด/ไม่มีข้อมูล</span>
            <span className="flex items-center gap-1"><span className="text-amber-500 font-bold">[ข้อความ]</span> ลา/มีหมายเหตุ</span>
            <span className="flex items-center gap-1"><span className="text-fuchsia-500 font-bold">?</span> ลืมสแกน/สแกนไม่ครบ</span>
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
                    <th key={date} className="w-[90px] min-w-[90px] px-1 py-3 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-200">
                      {dayNum}
                    </th>
                  );
                })}
                <th className="w-[60px] min-w-[60px] px-2 py-3 border border-slate-200 dark:border-slate-700 text-center font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20">ทำงาน<br/>(วัน)</th>
                <th className="w-[60px] min-w-[60px] px-2 py-3 border border-slate-200 dark:border-slate-700 text-center font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20">ลา<br/>(วัน)</th>
                <th className="w-[60px] min-w-[60px] px-2 py-3 border border-slate-200 dark:border-slate-700 text-center font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">รวม OT<br/>(ชม.)</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800">
              {reportData.employees.map((emp: any, index: number) => {
                let totalWorkDays = 0;
                let totalLeaveDays = 0;
                let totalOT = 0;

                return (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                  <td className="w-[50px] min-w-[50px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 text-center font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 sticky left-0 z-30">{index + 1}</td>
                  <td className="w-[80px] min-w-[80px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 sticky left-[50px] z-30">{emp.emp_code}</td>
                  <td className="w-[180px] min-w-[180px] px-3 py-2.5 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 sticky left-[130px] z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate">{emp.full_name}</td>
                  
                  {reportData.dates.map((date: string) => {
                    const key = `${emp.id}_${date}`;
                    const log = reportData.logsMap[key];
                    const lines = getDetailedLines(log);
                    
                    if (log) {
                      const hasTimeIn = log.time_in_1 || log.time_in_2 || log.time_in_3;
                      if (hasTimeIn) totalWorkDays += 1;
                      else if (log.remark) totalLeaveDays += 1;
                      if (log.daily_ot_hours) totalOT += Number(log.daily_ot_hours);
                    }

                    let textClass = 'text-slate-700 dark:text-slate-300 font-medium';
                    let bgClass = '';
                    
                    if (lines.length === 1 && lines[0] === 'x') {
                      textClass = 'text-rose-500 dark:text-rose-400 font-bold';
                      bgClass = 'bg-rose-50/50 dark:bg-rose-900/20';
                    } else if (lines.length === 1 && lines[0].startsWith('[')) {
                      textClass = 'text-amber-600 dark:text-amber-400 font-bold';
                      bgClass = 'bg-amber-50/50 dark:bg-amber-900/20';
                    } else if (lines.some(line => line.includes('?'))) {
                      textClass = 'text-fuchsia-600 dark:text-fuchsia-400 font-bold';
                      bgClass = 'bg-fuchsia-50/50 dark:bg-fuchsia-900/20';
                    }

                    return (
                      <td key={date} className={`w-[90px] min-w-[90px] px-1 py-1.5 border border-slate-200 dark:border-slate-700 text-center text-xs leading-[1.35] ${textClass} ${bgClass}`}>
                        {lines.map((line, i) => (
                          <div key={i} className="whitespace-nowrap">{line}</div>
                        ))}
                      </td>
                    );
                  })}
                  <td className="w-[60px] min-w-[60px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 text-center font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10">{totalWorkDays}</td>
                  <td className="w-[60px] min-w-[60px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 text-center font-bold text-amber-600 bg-amber-50/50 dark:bg-amber-900/10">{totalLeaveDays}</td>
                  <td className="w-[60px] min-w-[60px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 text-center font-bold text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10">{totalOT > 0 ? totalOT.toFixed(1) : '-'}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 font-sans">
      <div className="max-w-[1600px] mx-auto bg-white dark:bg-black/20 rounded-[24px] shadow-[var(--shadow-apple-soft)] overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-apple-blue p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-[980px] animate-pulse">
              <Cast className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold">{presentationState.title || 'กำลังนำเสนอ'}</h2>
              <p className="text-white/80 mt-1 font-medium">JST Industry - Live Dashboard</p>
            </div>
          </div>
          <div className="text-white/80 text-sm font-bold flex items-center gap-2">
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
          {presentationState.view_mode === 'detailed' && presentationState.payload && renderDetailedReport()}
        </div>

      </div>
    </div>
  );
}
