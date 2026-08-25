'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, ClipboardList, Edit, User, Smartphone, Building2, FolderOpen, MapPin, AlertTriangle, Wallet, FileText, CheckCircle, Save, Phone, Circle, UserCircle2, Clock, CalendarOff, LayoutDashboard, Settings, LogOut, BarChart3, Sun, Moon, Monitor, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as xlsx from 'xlsx';
import { saveAs } from 'file-saver';

export default function OTReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [otData, setOtData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [otSetting, setOtSetting] = useState('18:30'); // ค่าเริ่มต้นเผื่อดึงไม่ติด

  // ดึงเวลาเริ่มนับ OT จาก Settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('shift_settings').select('ot_in_end').eq('id', 1).single();
      if (data?.ot_in_end) setOtSetting(data.ot_in_end);
    };
    fetchSettings();
  }, []);

  // ฟังก์ชันแปลงเวลาเป็นทศนิยม (เช่น 18:30 -> 18.5)
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

  // ดึงข้อมูลและคำนวณโอที
  const generateOTReport = async () => {
    if (!startDate || !endDate) return alert('กรุณาเลือกวันที่');
    setIsLoading(true);

    try {
      const { data: employees } = await supabase.from('employees').select('id, emp_code, full_name, department, shift_id, hourly_rate, ot_hourly_rate').eq('status', 'Active');
      const { data: logs } = await supabase.from('attendance_logs').select('*').gte('log_date', startDate).lte('log_date', endDate);

      if (!employees) throw new Error("No employees");

      const { data: shifts } = await supabase.from('shifts').select('*');
      const shiftsMap = new Map((shifts || []).map(s => [s.id, s]));

      const summary = employees.map(emp => {
        const empShift = shiftsMap.get(emp.shift_id) || { ot_start_time: '18:30' };
        const otSettingStart = timeToHours(empShift.ot_start_time);
        const empLogs = logs?.filter(l => l.employee_id === emp.id) || [];
        
        let totalOTHours = 0;
        let otDaysCount = 0;
        let workDaysEarned = 0;

        empLogs.forEach(log => {
          // คำนวณวันทำงาน โดยอิงจาก pay_multiplier (เช่น ทำงานในวันหยุดนักขัตฤกษ์ได้ 2 แรง)
          if (log.time_in_1 && log.time_in_1 !== '-') {
            workDaysEarned += (log.pay_multiplier || 1.0);
          }

          // ดึงเวลาเข้า-ออก ทุกคู่
          const in1 = timeToHours(log.time_in_1);
          const out1 = timeToHours(log.time_out_1);
          const in2 = timeToHours(log.time_in_2);
          const out2 = timeToHours(log.time_out_2);
          const in3 = timeToHours(log.time_in_3);
          const out3 = timeToHours(log.time_out_3);

          let dailyOT = 0;

          // ตรวจสอบช่วงเวลาที่เกินจาก otSettingStart ในทุกๆ pair
          const pairs = [[in1, out1], [in2, out2], [in3, out3]];
          
          pairs.forEach(([tIn, tOut]) => {
            if (tIn > 0 && tOut > 0) {
              if (tOut > otSettingStart) {
                const actualOtStart = Math.max(tIn, otSettingStart);
                if (tOut > actualOtStart) {
                  dailyOT += (tOut - actualOtStart);
                }
              }
            }
          });

          if (dailyOT > 0) {
            totalOTHours += dailyOT;
            otDaysCount++;
          }
        });

        const totalOtPay = totalOTHours * (emp.ot_hourly_rate || 0);
        const totalWagePay = workDaysEarned * (emp.hourly_rate || 0);

        return {
          ...emp,
          work_days: workDaysEarned,
          ot_days: otDaysCount,
          total_ot: totalOTHours > 0 ? totalOTHours.toFixed(2) : '0.00',
          total_ot_pay: totalOtPay,
          total_wage_pay: totalWagePay,
          net_pay: totalOtPay + totalWagePay
        };
      });

      // กรองเอาคนที่มีข้อมูลการทำงาน
      const hasDataOnly = summary.filter(s => s.work_days > 0 || Number(s.total_ot) > 0).sort((a, b) => b.net_pay - a.net_pay);
      setOtData(hasDataOnly);

    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการคำนวณ');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (otData.length === 0) return alert('ไม่มีข้อมูล');
    const excelData = otData.map((r, i) => ({
      'ลำดับ': i + 1,
      'รหัส': r.emp_code,
      'ชื่อ-นามสกุล': r.full_name,
      'แผนก': r.department,
      'จำนวนวันทำงาน (แรง)': r.work_days,
      'รวมค่าแรงปกติ (บาท)': r.total_wage_pay,
      'จำนวนวันที่ทำ OT': r.ot_days,
      'รวมชั่วโมง OT': Number(r.total_ot),
      'รวมค่า OT (บาท)': r.total_ot_pay,
      'รายได้สุทธิ (บาท)': r.net_pay
    }));

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'สรุปค่าจ้างและโอที');
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `สรุปค่าจ้าง_${startDate}_ถึง_${endDate}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto font-sans">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition">&larr;</Link>
            รายงานสรุปค่าจ้างและโอที (Payroll & OT)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-10 font-medium">คำนวณค่าแรงรายวันและ OT อัตโนมัติ (สามารถเลือกช่วงตัดวีคได้ เช่น 1-15 หรือ 16-31)</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row items-end gap-6">
        <div className="flex-1 flex gap-4 w-full">
          <div className="w-full">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">รอบตัดวีค (เริ่มต้น)</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none" />
          </div>
          <div className="w-full">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">รอบตัดวีค (สิ้นสุด)</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={generateOTReport} disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm">
            {isLoading ? 'กำลังคำนวณ...' : <><Wallet className="w-5 h-5" /> คำนวณค่าจ้าง</>}
          </button>
          <button onClick={exportToExcel} disabled={otData.length === 0} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm">
            ดาวน์โหลด Excel
          </button>
        </div>
      </div>

      {otData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-slate-700 dark:text-slate-200">รหัส</th>
                <th className="px-6 py-4 text-left font-bold text-slate-700 dark:text-slate-200">ชื่อ-นามสกุล</th>
                <th className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-200">มาทำงาน (วัน)</th>
                <th className="px-6 py-4 text-right font-bold text-indigo-700 dark:text-indigo-400">ค่าแรง (บาท)</th>
                <th className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">ทำ OT (วัน)</th>
                <th className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-200">ชม. OT</th>
                <th className="px-6 py-4 text-right font-bold text-orange-600 dark:text-orange-400">ค่า OT (บาท)</th>
                <th className="px-6 py-4 text-right font-bold text-emerald-700 dark:text-emerald-400 border-l border-slate-200 dark:border-slate-700 text-lg">รายได้สุทธิ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {otData.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:bg-slate-900">
                  <td className="px-6 py-3 font-bold text-slate-800 dark:text-slate-100">{emp.emp_code}</td>
                  <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{emp.full_name}</td>
                  <td className="px-6 py-3 text-center text-slate-600 dark:text-slate-300 font-bold bg-slate-50/50">{emp.work_days}</td>
                  <td className="px-6 py-3 text-right text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/20">{emp.total_wage_pay.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  
                  <td className="px-6 py-3 text-center text-slate-600 dark:text-slate-300 font-bold border-l border-slate-100 dark:border-slate-800">{emp.ot_days}</td>
                  <td className="px-6 py-3 text-center text-slate-600 dark:text-slate-300 font-bold">{emp.total_ot}</td>
                  <td className="px-6 py-3 text-right text-orange-600 dark:text-orange-400 font-bold bg-orange-50/20">{emp.total_ot_pay.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  
                  <td className="px-6 py-3 text-right text-emerald-700 dark:text-emerald-400 font-black border-l border-slate-100 dark:border-slate-800 bg-emerald-50/20 text-lg">
                    {emp.net_pay.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}