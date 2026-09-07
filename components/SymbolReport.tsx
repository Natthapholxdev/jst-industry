'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, ClipboardList, Edit, User, Smartphone, Building2, FolderOpen, MapPin, AlertTriangle, Wallet, FileText, CheckCircle, Save, Phone, Circle, UserCircle2, Clock, CalendarOff, LayoutDashboard, Settings, LogOut, BarChart3, Sun, Moon, Monitor, Flame, Cast } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '@/lib/supabase';
import * as xlsx from 'xlsx';
import { saveAs } from 'file-saver';

export default function SymbolReport() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [reportData, setReportData] = useState<{ employees: any[], dates: string[], logsMap: any, shifts: any[], settings: any } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getDatesInRange = (start: string, end: string) => {
    const dateArray: string[] = [];
    let currentDate = new Date(start);
    const stopDate = new Date(end);
    
    while (currentDate <= stopDate) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  };

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

  const generateReport = async () => {
    if (!startDate || !endDate) return alert('กรุณาเลือกช่วงวันที่ให้ครบถ้วน');
    if (startDate > endDate) return alert('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');

    setIsLoading(true);

    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, emp_code, full_name, department, position, shift_id')
        .eq('status', 'Active')
        .order('emp_code', { ascending: true });

      const { data: logs } = await supabase
        .from('attendance_logs')
        .select('*')
        .gte('log_date', startDate)
        .lte('log_date', endDate);

      const { data: shifts } = await supabase.from('shifts').select('*');
      const { data: settings } = await supabase.from('shift_settings').select('ot_in_end').eq('id', 1).single();

      if (!employees) throw new Error("ไม่พบข้อมูลพนักงาน");

      const logsMap: any = {};
      logs?.forEach(log => {
        const key = `${log.employee_id}_${log.log_date}`;
        logsMap[key] = log;
      });

      const dates = getDatesInRange(startDate, endDate);

      setReportData({ employees, dates, logsMap, shifts: shifts || [], settings: settings || {} });

    } catch (error) {
      console.error('Report error:', error);
      alert('เกิดข้อผิดพลาดในการสร้างรายงาน');
    } finally {
      setIsLoading(false);
    }
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
    const empShift = dataMap.shifts.find((s: any) => s.id === emp.shift_id) || { ot_start_time: '18:30', time_in: '08:00' };
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

  const exportToExcel = () => {
    if (!reportData) return alert('ไม่มีข้อมูลสำหรับดาวน์โหลด');

    const { employees, dates, logsMap } = reportData;

    const excelData = employees.map((emp, index) => {
      const row: any = {
        'ลำดับ': index + 1,
        'รหัส': emp.emp_code,
        'ชื่อ-นามสกุล': emp.full_name,
        'แผนก': emp.department || '-',
        'ตำแหน่ง': emp.position || '-'
      };

      dates.forEach(date => {
        const key = `${emp.id}_${date}`;
        const log = logsMap[key];
        row[date] = getStatusSymbol(log, emp, reportData);
      });

      return row;
    });

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'รายงานการลงเวลา');

    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    saveAs(data, `รายงานบัตรลงเวลา_${startDate}_ถึง_${endDate}.xlsx`);
  };

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const applyPreset = (type: '1-15' | '16-end' | 'full') => {
    if (!selectedMonth) return alert('กรุณาเลือกเดือนที่ต้องการก่อน');
    const [year, month] = selectedMonth.split('-');
    const lastDay = new Date(Number(year), Number(month), 0).getDate();

    if (type === '1-15') {
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-15`);
    } else if (type === '16-end') {
      setStartDate(`${year}-${month}-16`);
      setEndDate(`${year}-${month}-${lastDay}`);
    } else {
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${lastDay}`);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-full mx-auto font-sans">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            รายงานแบบสัญลักษณ์
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">สรุปข้อมูลตารางลงเวลาแบบสัญลักษณ์ (/, //, ส, น, x, /OT)</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row items-end gap-6">
        <div className="flex-1 w-full flex flex-col gap-4">
          
          {/* แถวสำหรับเลือกเดือนและปุ่ม Preset */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">เลือกเดือน:</label>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button onClick={() => applyPreset('1-15')} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold border border-indigo-200 transition">วันที่ 1 - 15</button>
              <button onClick={() => applyPreset('16-end')} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold border border-indigo-200 transition">วันที่ 16 - สิ้นเดือน</button>
              <button onClick={() => applyPreset('full')} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold border border-indigo-200 transition">ทั้งเดือน</button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">ตั้งแต่วันที่</label>
              <input 
                type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="w-full">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">ถึงวันที่</label>
              <input 
                type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
          <button 
            onClick={generateReport} disabled={isLoading}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 font-bold rounded-lg transition shadow-sm
              ${isLoading ? 'bg-slate-300 text-slate-500 dark:text-slate-400' : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white'}`}
          >
            {isLoading ? 'ดึงข้อมูล...' : <><Search className="w-5 h-5" /> ดึงข้อมูล</>}
          </button>
          
          <button 
            onClick={exportToExcel} 
            disabled={!reportData}
            className={`flex-1 md:flex-none px-6 py-2.5 font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-2
              ${!reportData ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'}`}
          >
            📊 ดาวน์โหลด Excel
          </button>
          
          <button 
            onClick={async () => {
              try {
                const res = await fetch('/api/presentation', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ is_active: true, view_mode: 'symbol', title: 'รายงานแบบสัญลักษณ์', payload: { reportData, startDate, endDate } })
                });
                const result = await res.json();
                if (result.success) {
                  Swal.fire({ icon: 'success', title: 'นำเสนอสำเร็จ', text: 'ข้อมูลกำลังแสดงที่หน้า /live', timer: 2000, showConfirmButton: false });
                }
              } catch (e) {
                alert('เกิดข้อผิดพลาดในการนำเสนอ');
              }
            }}
            disabled={!reportData}
            className={`flex-1 md:flex-none px-6 py-2.5 font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-2
              ${!reportData ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}
          >
            <Cast className="w-5 h-5" /> นำเสนอขึ้นจอ
          </button>
        </div>
      </div>

      {reportData && (
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
                  
                  {reportData.dates.map((date) => {
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
                {reportData.employees.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                    <td className="w-[50px] min-w-[50px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 text-center font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 sticky left-0 z-30">{index + 1}</td>
                    <td className="w-[80px] min-w-[80px] px-2 py-2.5 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 sticky left-[50px] z-30">{emp.emp_code}</td>
                    <td className="w-[180px] min-w-[180px] px-3 py-2.5 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 sticky left-[130px] z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate">{emp.full_name}</td>
                    
                    {reportData.dates.map((date) => {
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
      )}
    </div>
  );
}