'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, ClipboardList, Edit, User, Smartphone, Building2, FolderOpen, MapPin, AlertTriangle, Wallet, FileText, CheckCircle, Save, Phone, Circle, UserCircle2, Clock, CalendarOff, LayoutDashboard, Settings, LogOut, BarChart3, Sun, Moon, Monitor, Flame, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as xlsx from 'xlsx';
import { saveAs } from 'file-saver';
import ThaiDatePicker from '@/components/ThaiDatePicker';

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

  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  // ดึงเวลาเริ่มนับ OT จาก Settings
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: settingData } = await supabase.from('shift_settings').select('ot_in_end').eq('id', 1).single();
      if (settingData?.ot_in_end) setOtSetting(settingData.ot_in_end);
      
      const { data: empData } = await supabase.from('employees').select('id, emp_code, full_name, department').eq('status', 'Active').order('emp_code', { ascending: true });
      if (empData) {
        setAllEmployees(empData);
        const uniqueDepts = Array.from(new Set(empData.map(e => e.department).filter(Boolean)));
        setDepartments(uniqueDepts as string[]);
      }
    };
    fetchInitialData();
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
        const empShift = shiftsMap.get(emp.shift_id);
        const otSettingStart = timeToHours(empShift?.ot_start_time || otSetting);
        const empLogs = logs?.filter(l => l.employee_id === emp.id) || [];
        
        let normal_work_days = 0;
        let normal_wage_pay = 0;
        let holiday_work_days = 0;
        let holiday_wage_pay = 0;

        let otDaysCount = 0;
        let ot_1_0_hours = 0, ot_1_0_pay = 0;
        let ot_1_5_hours = 0, ot_1_5_pay = 0;
        let ot_2_0_hours = 0, ot_2_0_pay = 0;
        let ot_3_0_hours = 0, ot_3_0_pay = 0;

        let totalExtraAdd = 0;
        let totalExtraDeduct = 0;

        empLogs.forEach(log => {
          let payMult = Number(log.pay_multiplier) || 1.0;
          if (log.time_in_1 && log.time_in_1 !== '-') {
            if (payMult > 1.0) {
              holiday_work_days++;
              holiday_wage_pay += (emp.hourly_rate || 0) * payMult;
            } else {
              normal_work_days++;
              normal_wage_pay += (emp.hourly_rate || 0);
            }
          }
          
          totalExtraAdd += Number(log.extra_add || 0);
          totalExtraDeduct += Number(log.extra_deduct || 0);

          const in1 = timeToHours(log.time_in_1);
          const out1 = timeToHours(log.time_out_1);
          const in2 = timeToHours(log.time_in_2);
          const out2 = timeToHours(log.time_out_2);
          const in3 = timeToHours(log.time_in_3);
          const out3 = timeToHours(log.time_out_3);
          const in4 = timeToHours(log.time_in_4);
          const out4 = timeToHours(log.time_out_4);

          let dailyOT = 0;
          const pairs = [[in1, out1], [in2, out2], [in3, out3], [in4, out4]];
          
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
            otDaysCount++;
            const dailyOtMultiplier = Number(log.ot_multiplier) || 1.0;
            const pay = dailyOT * (emp.ot_hourly_rate || 0) * dailyOtMultiplier;
            
            if (dailyOtMultiplier === 1.5) {
              ot_1_5_hours += dailyOT;
              ot_1_5_pay += pay;
            } else if (dailyOtMultiplier === 2.0) {
              ot_2_0_hours += dailyOT;
              ot_2_0_pay += pay;
            } else if (dailyOtMultiplier === 3.0) {
              ot_3_0_hours += dailyOT;
              ot_3_0_pay += pay;
            } else {
              ot_1_0_hours += dailyOT;
              ot_1_0_pay += pay;
            }
          }
        });

        const totalWagePay = normal_wage_pay + holiday_wage_pay;
        const totalOTHours = ot_1_0_hours + ot_1_5_hours + ot_2_0_hours + ot_3_0_hours;
        const totalOtPay = ot_1_0_pay + ot_1_5_pay + ot_2_0_pay + ot_3_0_pay;

        return {
          ...emp,
          normal_work_days,
          normal_wage_pay,
          holiday_work_days,
          holiday_wage_pay,
          ot_days: otDaysCount,
          ot_1_0_hours, ot_1_0_pay,
          ot_1_5_hours, ot_1_5_pay,
          ot_2_0_hours, ot_2_0_pay,
          ot_3_0_hours, ot_3_0_pay,
          total_ot: totalOTHours > 0 ? totalOTHours.toFixed(2) : '0.00',
          total_ot_pay: totalOtPay,
          total_extra_add: totalExtraAdd,
          total_extra_deduct: totalExtraDeduct,
          total_wage_pay: totalWagePay,
          net_pay: totalOtPay + totalWagePay + totalExtraAdd - totalExtraDeduct
        };
      });

      // กรองเอาคนที่มีข้อมูลการทำงาน
      const hasDataOnly = summary.filter(s => s.normal_work_days > 0 || s.holiday_work_days > 0 || Number(s.total_ot) > 0).sort((a, b) => b.net_pay - a.net_pay);
      setOtData(hasDataOnly);

    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการคำนวณ');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOtData = otData.filter(emp => {
    const matchDept = selectedDepts.length === 0 || selectedDepts.includes(emp.department);
    const matchEmp = selectedEmps.length === 0 || selectedEmps.includes(emp.id);
    return matchDept && matchEmp;
  });

  const exportToExcel = () => {
    if (filteredOtData.length === 0) return alert('ไม่มีข้อมูล');
    const excelData = filteredOtData.map((r, i) => ({
      'ลำดับ': i + 1,
      'รหัส': r.emp_code,
      'ชื่อ-นามสกุล': r.full_name,
      'แผนก': r.department,
      'วันทำงานปกติ (วัน)': r.normal_work_days,
      'ค่าแรงปกติ (บาท)': r.normal_wage_pay,
      'วันหยุด/พิเศษ (วัน)': r.holiday_work_days,
      'ค่าแรงวันหยุด (บาท)': r.holiday_wage_pay,
      'OT x1.0 (ชม.)': r.ot_1_0_hours > 0 ? r.ot_1_0_hours : null,
      'ค่า OT x1.0': r.ot_1_0_pay > 0 ? r.ot_1_0_pay : null,
      'OT x1.5 (ชม.)': r.ot_1_5_hours > 0 ? r.ot_1_5_hours : null,
      'ค่า OT x1.5': r.ot_1_5_pay > 0 ? r.ot_1_5_pay : null,
      'OT x2.0 (ชม.)': r.ot_2_0_hours > 0 ? r.ot_2_0_hours : null,
      'ค่า OT x2.0': r.ot_2_0_pay > 0 ? r.ot_2_0_pay : null,
      'OT x3.0 (ชม.)': r.ot_3_0_hours > 0 ? r.ot_3_0_hours : null,
      'ค่า OT x3.0': r.ot_3_0_pay > 0 ? r.ot_3_0_pay : null,
      'เงินเพิ่มรวม (บาท)': r.total_extra_add,
      'เงินหักรวม (บาท)': r.total_extra_deduct,
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
    <div className="p-2 sm:p-4 max-w-full w-full mx-auto font-sans">
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
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="w-full">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">รอบตัดวีค (เริ่มต้น)</label>
            <ThaiDatePicker value={startDate} onChange={val => setStartDate(val)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none" />
          </div>
          <div className="w-full">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">รอบตัดวีค (สิ้นสุด)</label>
            <ThaiDatePicker value={endDate} onChange={val => setEndDate(val)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none" />
          </div>
          <div className="w-full col-span-1 md:col-span-2 flex items-end gap-2 mb-1">
            <button 
              onClick={() => {
                const d = new Date(startDate);
                const year = d.getFullYear();
                const month = d.getMonth();
                setStartDate(new Date(year, month, 1, 7).toISOString().split('T')[0]);
                setEndDate(new Date(year, month, 15, 7).toISOString().split('T')[0]);
              }} 
              className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-md transition"
            >
              งวด 1-15
            </button>
            <button 
              onClick={() => {
                const d = new Date(startDate);
                const year = d.getFullYear();
                const month = d.getMonth();
                setStartDate(new Date(year, month, 16, 7).toISOString().split('T')[0]);
                setEndDate(new Date(year, month + 1, 0, 7).toISOString().split('T')[0]);
              }} 
              className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-md transition"
            >
              งวด 16-สิ้นเดือน
            </button>
            <button 
              onClick={() => {
                const d = new Date(startDate);
                const year = d.getFullYear();
                const month = d.getMonth();
                setStartDate(new Date(year, month - 1, 26, 7).toISOString().split('T')[0]);
                setEndDate(new Date(year, month, 25, 7).toISOString().split('T')[0]);
              }} 
              className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-md transition"
            >
              งวด 26-25
            </button>
          </div>
          {/* แผนก */}
          <div className="w-full relative">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">แผนก (Filter)</label>
            <details className="group relative">
              <summary className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none cursor-pointer list-none flex justify-between items-center">
                <span className="truncate">
                  {selectedDepts.length === 0 ? 'ทุกแผนก' : `เลือกแล้ว ${selectedDepts.length} แผนก`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </summary>
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {departments.map(dept => (
                  <label key={dept} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b dark:border-slate-700 last:border-0">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      checked={selectedDepts.includes(dept)} 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedDepts([...selectedDepts, dept]);
                        else setSelectedDepts(selectedDepts.filter(d => d !== dept));
                      }} 
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{dept || 'ไม่ระบุแผนก'}</span>
                  </label>
                ))}
              </div>
            </details>
          </div>
          {/* พนักงาน */}
          <div className="w-full relative">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">พนักงาน (Filter)</label>
            <details className="group relative">
              <summary className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none cursor-pointer list-none flex justify-between items-center">
                <span className="truncate">
                  {selectedEmps.length === 0 ? 'ทุกคน' : `เลือกแล้ว ${selectedEmps.length} คน`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </summary>
              <div className="absolute z-20 w-72 right-0 md:left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl flex flex-col">
                <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                  <input 
                    type="text" 
                    placeholder="ค้นหาชื่อ หรือรหัส..." 
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-900 border-none rounded-md outline-none"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {allEmployees.filter(emp => !empSearch || emp.full_name.includes(empSearch) || emp.emp_code.includes(empSearch)).map(emp => (
                    <label key={emp.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b dark:border-slate-700 last:border-0">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        checked={selectedEmps.includes(emp.id)} 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedEmps([...selectedEmps, emp.id]);
                          else setSelectedEmps(selectedEmps.filter(id => id !== emp.id));
                        }} 
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">{emp.emp_code} - {emp.full_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </details>
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

      {filteredOtData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-900 text-xs text-center whitespace-nowrap">
              <tr>
                <th rowSpan={2} className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200">รหัส</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200">ชื่อ-นามสกุล</th>
                <th colSpan={2} className="px-4 py-2 font-bold text-indigo-700 bg-indigo-50/50 border-l border-slate-200">วันทำงานปกติ (x1)</th>
                <th colSpan={2} className="px-4 py-2 font-bold text-indigo-700 bg-indigo-100/50 border-l border-slate-200">วันหยุดพิเศษ (x2)</th>
                <th colSpan={4} className="px-4 py-2 font-bold text-orange-700 bg-orange-50/50 border-l border-slate-200">ชั่วโมง OT (แยกเรท)</th>
                <th rowSpan={2} className="px-4 py-3 font-bold text-orange-700 bg-orange-100/50 border-l border-slate-200">รวมเงิน OT</th>
                <th rowSpan={2} className="px-4 py-3 font-bold text-emerald-600 border-l border-slate-200">เงินเพิ่ม</th>
                <th rowSpan={2} className="px-4 py-3 font-bold text-rose-600 border-l border-slate-200">เงินหัก</th>
                <th rowSpan={2} className="px-6 py-3 font-bold text-emerald-700 border-l border-slate-200 text-base">ยอดสุทธิ</th>
              </tr>
              <tr>
                <th className="px-3 py-2 font-semibold text-slate-600 border-l border-slate-200 border-t">วัน</th>
                <th className="px-3 py-2 font-semibold text-slate-600 border-t">ยอดเงิน</th>
                <th className="px-3 py-2 font-semibold text-slate-600 border-l border-slate-200 border-t">วัน</th>
                <th className="px-3 py-2 font-semibold text-slate-600 border-t">ยอดเงิน</th>
                <th className="px-3 py-2 font-semibold text-slate-600 border-l border-slate-200 border-t">x1.0</th>
                <th className="px-3 py-2 font-semibold text-slate-600 border-t">x1.5</th>
                <th className="px-3 py-2 font-semibold text-slate-600 border-t">x2.0</th>
                <th className="px-3 py-2 font-semibold text-slate-600 border-t">x3.0</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOtData.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:bg-slate-900 text-center whitespace-nowrap">
                  <td className="px-4 py-3 text-left font-bold text-slate-800 dark:text-slate-100">{emp.emp_code}</td>
                  <td className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">{emp.full_name}</td>
                  
                  <td className="px-3 py-3 border-l border-slate-100 bg-indigo-50/10">{emp.normal_work_days > 0 ? emp.normal_work_days : '-'}</td>
                  <td className="px-3 py-3 text-indigo-600 font-bold bg-indigo-50/20">{emp.normal_wage_pay > 0 ? emp.normal_wage_pay.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</td>
                  
                  <td className="px-3 py-3 border-l border-slate-100 bg-indigo-100/10">{emp.holiday_work_days > 0 ? emp.holiday_work_days : '-'}</td>
                  <td className="px-3 py-3 text-indigo-600 font-bold bg-indigo-100/20">{emp.holiday_wage_pay > 0 ? emp.holiday_wage_pay.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</td>
                  
                  <td className="px-3 py-3 border-l border-slate-100 text-slate-500">{emp.ot_1_0_hours > 0 ? emp.ot_1_0_hours.toFixed(2) : '-'}</td>
                  <td className="px-3 py-3 font-semibold text-orange-600">{emp.ot_1_5_hours > 0 ? emp.ot_1_5_hours.toFixed(2) : '-'}</td>
                  <td className="px-3 py-3 font-semibold text-orange-600">{emp.ot_2_0_hours > 0 ? emp.ot_2_0_hours.toFixed(2) : '-'}</td>
                  <td className="px-3 py-3 font-semibold text-orange-600">{emp.ot_3_0_hours > 0 ? emp.ot_3_0_hours.toFixed(2) : '-'}</td>
                  
                  <td className="px-4 py-3 text-orange-600 font-bold border-l border-slate-100 bg-orange-50/20">{emp.total_ot_pay > 0 ? emp.total_ot_pay.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</td>
                  
                  <td className="px-4 py-3 text-emerald-600 font-bold border-l border-slate-100">{emp.total_extra_add > 0 ? emp.total_extra_add.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</td>
                  <td className="px-4 py-3 text-rose-600 font-bold border-l border-slate-100">{emp.total_extra_deduct > 0 ? emp.total_extra_deduct.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</td>

                  <td className="px-6 py-3 text-right text-emerald-700 font-black border-l border-slate-100 bg-emerald-50/20 text-base">
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