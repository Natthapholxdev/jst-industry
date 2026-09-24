"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, User, Save, Printer, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import * as xlsx from 'xlsx';
import { saveAs } from 'file-saver';
import { ROUTES } from '@/lib/routes';

const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const ThaiTimeInput = ({
  value,
  onChange,
  theme = "indigo",
  isLate = false
}: {
  value: string;
  onChange: (val: string) => void;
  theme?: "indigo" | "orange";
  isLate?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value || "");

  useEffect(() => {
    setLocalVal(value || "");
  }, [value]);

  let colorClass = theme === "orange" ? "text-orange-700 border-orange-500 ring-2 ring-orange-200" : "text-indigo-700 dark:text-indigo-300 border-indigo-500 ring-2 ring-indigo-200";
  let displayClass = theme === "orange" ? "bg-white dark:bg-slate-800 border-orange-200 hover:bg-orange-50 text-orange-700 cursor-pointer" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 cursor-pointer";

  if (isLate) {
    colorClass = "text-rose-700 dark:text-rose-300 border-rose-500 ring-2 ring-rose-200";
    displayClass = "bg-rose-50 dark:bg-rose-900/30 border-rose-200 hover:bg-rose-100 text-rose-700 dark:text-rose-400 cursor-pointer";
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    
    let formatted = val;
    if (val.length >= 3) {
      formatted = `${val.slice(0, 2)}:${val.slice(2)}`;
    }
    
    if (formatted.length >= 2) {
      const h = parseInt(formatted.slice(0, 2), 10);
      if (h > 23) formatted = '23' + formatted.slice(2);
    }
    if (formatted.length === 5) {
      const m = parseInt(formatted.slice(3, 5), 10);
      if (m > 59) formatted = formatted.slice(0, 3) + '59';
    }
    
    setLocalVal(formatted);
  };

  if (isEditing) {
    return (
      <input
        type="text"
        placeholder="08:00"
        maxLength={5}
        autoFocus
        className={`w-full min-w-[64px] px-1 py-1 text-xs font-bold text-center bg-white dark:bg-slate-800 border rounded outline-none transition-all shadow-sm ${colorClass}`}
        value={localVal}
        onChange={handleTimeChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        onBlur={() => {
          setIsEditing(false);
          let finalVal = localVal;
          if (finalVal.length > 0 && finalVal.length < 5) {
            const nums = finalVal.replace(':', '');
            if (nums.length === 1) finalVal = `0${nums}:00`;
            else if (nums.length === 2) finalVal = `${nums}:00`;
            else if (nums.length === 3) finalVal = `${finalVal}0`;
          }
          setLocalVal(finalVal);
          
          if (finalVal !== value) {
            onChange(finalVal);
          }
        }}
      />
    );
  }

  return (
    <div
      tabIndex={0}
      onFocus={() => setIsEditing(true)}
      onClick={() => setIsEditing(true)}
      className={`w-full min-w-[64px] px-1 py-1 text-xs font-bold border rounded text-center transition-all shadow-sm focus:ring-2 focus:outline-none ${displayClass}`}
      title="คลิกหรือกด Tab เพื่อแก้ไขเวลา"
    >
      {value ? (
        <span className="flex items-center justify-center gap-1">
          {value} <span className="text-[9px] opacity-70 font-normal">น.</span>
        </span>
      ) : (
        <span className="text-slate-400 font-medium">-</span>
      )}
    </div>
  );
};

export default function AttendancePersonPage() {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");

  const [yearSummary, setYearSummary] = useState<Record<number, { workDays: number, otHours: number }>>({});
  const [records, setRecords] = useState<any[]>([]);
  
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const empIdFromUrl = params.get('empId');

    const fetchEmployees = async () => {
      const { data } = await supabase.from('employees').select('id, emp_code, full_name, shift_id').eq('status', 'Active').order('emp_code', { ascending: true });
      const { data: shiftsData } = await supabase.from('shifts').select('*');
      if (shiftsData) setShifts(shiftsData);
      if (data) {
        setEmployees(data);
        if (empIdFromUrl && data.some(e => e.id === empIdFromUrl)) {
          setSelectedEmpId(empIdFromUrl);
        } else if (data.length > 0) {
          setSelectedEmpId(data[0].id);
        }
      }
    };
    fetchEmployees();
  }, []);

  const fetchYearSummary = useCallback(async (empId: string, year: number) => {
    if (!empId) return;
    setIsLoadingSummary(true);
    try {
      const { data } = await supabase
        .from('attendance_logs')
        .select('log_date, time_in_1, time_out_1, time_in_2, time_out_2, time_in_3, time_out_3')
        .eq('employee_id', empId)
        .gte('log_date', `${year}-01-01`)
        .lte('log_date', `${year}-12-31`);

      const summary: Record<number, { workDays: number, otHours: number }> = {};
      for (let i = 0; i < 12; i++) summary[i] = { workDays: 0, otHours: 0 };

      if (data) {
        data.forEach(log => {
          const month = parseInt(log.log_date.split('-')[1], 10) - 1;
          const hasWork = log.time_in_1 || log.time_out_1 || log.time_in_2 || log.time_out_2;
          if (hasWork) {
            summary[month].workDays += 1;
          }
          if (log.time_in_3 === 'OT') {
             summary[month].otHours += (Number(log.time_out_3) || 0);
          } else if (log.time_in_3 && log.time_out_3) {
             const otIn = timeToHours(log.time_in_3);
             const otOut = timeToHours(log.time_out_3);
             if (otIn > 0 && otOut > otIn) summary[month].otHours += (otOut - otIn);
          }
        });
      }
      setYearSummary(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEmpId) {
      fetchYearSummary(selectedEmpId, viewYear);
    }
  }, [selectedEmpId, viewYear, fetchYearSummary]);

  const fetchMonthRecords = useCallback(async (empId: string, year: number, monthIndex: number) => {
    setIsLoadingDetail(true);
    try {
      const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
      const endDate = new Date(year, monthIndex + 1, 0).toISOString().split("T")[0];

      const dateArray = [];
      let currentDate = new Date(startDate);
      const lastDate = new Date(endDate);

      while (currentDate <= lastDate) {
        dateArray.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const { data: logs } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("employee_id", empId)
        .gte("log_date", startDate)
        .lte("log_date", endDate);

      const { data: holidays } = await supabase
        .from("holidays")
        .select("*")
        .gte("holiday_date", startDate)
        .lte("holiday_date", endDate);

      const empInfo = employees.find(e => e.id === empId);

      const combinedRecords = dateArray.map(dateStr => {
        const log = logs?.find(l => l.log_date === dateStr);
        const holiday = holidays?.find(h => h.holiday_date === dateStr);

        let defaultMultiplier = 1.0;
        if (holiday) defaultMultiplier = holiday.multiplier || 2.0;

        const empShift = shifts.find(s => s.id === empInfo?.shift_id) || { time_in: '08:00', ot_start_time: '18:30' };
        const shiftStart = timeToHours(empShift.time_in);

        let isLate = false;
        if (log?.time_in_1 && log.time_in_1 !== '-') {
          isLate = timeToHours(log.time_in_1) > shiftStart;
        }

        let dailyOT = 0;
        if (log?.time_in_3 === 'OT') {
          dailyOT += Number(log?.time_out_3) || 0;
        }
        const otIn = timeToHours(log?.time_in_3);
        const otOut = timeToHours(log?.time_out_3);
        if (log?.time_in_3 !== 'OT' && otIn > 0 && otOut > otIn) {
          dailyOT += otOut - otIn;
        }

        return {
          log_date: dateStr,
          id: empId,
          emp_code: empInfo?.emp_code,
          full_name: empInfo?.full_name,
          time_in_1: log?.time_in_1 || "",
          time_out_1: log?.time_out_1 || "",
          time_in_2: log?.time_in_2 || "",
          time_out_2: log?.time_out_2 || "",
          time_in_3: log?.time_in_3 || "",
          time_out_3: log?.time_out_3 || "",
          time_in_4: log?.time_in_4 || "",
          time_out_4: log?.time_out_4 || "",
          remark: log?.remark || "",
          pay_multiplier: log?.pay_multiplier ?? defaultMultiplier,
          ot_multiplier: log?.ot_multiplier || 1.0,
          extra_add: log?.extra_add || "",
          extra_deduct: log?.extra_deduct || "",
          is_holiday: !!holiday,
          holiday_name: holiday?.name || "",
          is_edited: false,
          is_late: isLate,
          calculated_ot: dailyOT > 0 ? dailyOT : 0
        };
      });

      setRecords(combinedRecords);
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "ข้อผิดพลาด", text: "ดึงข้อมูลล้มเหลว" });
    } finally {
      setIsLoadingDetail(false);
    }
  }, [employees, shifts]);

  useEffect(() => {
    if (selectedMonth !== null && selectedEmpId) {
      fetchMonthRecords(selectedEmpId, viewYear, selectedMonth);
    }
  }, [selectedMonth, selectedEmpId, viewYear, fetchMonthRecords]);

  const handleInputChange = (dateStr: string, field: string, value: string) => {
    setRecords(records.map((rec) =>
      rec.log_date === dateStr ? { ...rec, [field]: value, is_edited: true } : rec
    ));
  };

  const handleSave = useCallback(async (isAutoSave = false) => {
    const editedRecords = records.filter(r => r.is_edited);
    if (editedRecords.length === 0) {
      if (!isAutoSave) Swal.fire({ icon: "info", title: "ไม่มีการเปลี่ยนแปลง", text: "ยังไม่มีการแก้ไขข้อมูล", confirmButtonColor: "#4f46e5" });
      return true;
    }

    if (!isAutoSave) {
      const result = await Swal.fire({
        title: "ยืนยันการบันทึก?",
        text: "ระบบจะบันทึกข้อมูลและประวัติการแก้ไข",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#ef4444",
        confirmButtonText: "ใช่, บันทึกข้อมูล",
        cancelButtonText: "ยกเลิก",
      });
      if (!result.isConfirmed) return false;
      Swal.fire({ title: "กำลังบันทึก...", allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    }

    let hasError = false;
    for (const rec of editedRecords) {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: rec.log_date, records: [rec] }),
        });
        if (!res.ok) hasError = true;
      } catch (e) {
        hasError = true;
      }
    }

    if (hasError) {
      if (!isAutoSave) Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด!", text: "บางรายการไม่สามารถบันทึกได้ โปรดลองอีกครั้ง", confirmButtonColor: "#ef4444" });
      return false;
    } else {
      if (!isAutoSave) Swal.fire({ icon: "success", title: "บันทึกสำเร็จ!", text: "อัพเดทข้อมูลเรียบร้อยแล้ว", confirmButtonColor: "#10b981" });
      
      setRecords(prev => prev.map(r => r.is_edited ? { ...r, is_edited: false } : r));
      fetchYearSummary(selectedEmpId, viewYear);
      return true;
    }
  }, [records, selectedEmpId, viewYear, fetchYearSummary]);

  useEffect(() => {
    const edited = records.filter(r => r.is_edited);
    if (edited.length === 0) return;

    const timer = setTimeout(() => {
      handleSave(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [records, handleSave]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (records.some(r => r.is_edited)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && !anchor.href.includes(window.location.pathname)) {
        if (records.some(r => r.is_edited)) {
          e.preventDefault();
          Swal.fire({
            title: 'มีข้อมูลกำลังบันทึก!',
            text: 'ระบบกำลังบันทึกข้อมูลอัตโนมัติ คุณต้องการรอสักครู่ หรือทิ้งข้อมูลแล้วออกเลย?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'บันทึก & ออก',
            cancelButtonText: 'ทิ้งข้อมูลแล้วออก',
          }).then(async (result) => {
            if (result.isConfirmed) {
              const success = await handleSave(false);
              if (success) window.location.href = anchor.href;
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              window.location.href = anchor.href;
            }
          });
        }
      }
    };
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick);
    };
  }, [records, handleSave]);

  const [colVisibility, setColVisibility] = useState({
    time_in_1: true,
    time_out_1: true,
    time_in_2: true,
    time_out_2: true,
    time_in_3: true,
    time_out_3: true,
    calculated_ot: true,
    remark: true,
    pay_multiplier: true,
    ot_multiplier: true,
    extra_add: true,
    extra_deduct: true
  });

  const toggleCol = (key: keyof typeof colVisibility) => {
    setColVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const colLabels: Record<keyof typeof colVisibility, string> = {
    time_in_1: 'เข้าเช้า (08:00)',
    time_out_1: 'ออกเช้า (12:00)',
    time_in_2: 'เข้าบ่าย (13:00)',
    time_out_2: 'ออกบ่าย (17:00)',
    time_in_3: 'เข้า OT (17:00)',
    time_out_3: 'ออก OT (21:00)',
    calculated_ot: 'รวม OT (ชม.)',
    remark: 'หมายเหตุ',
    pay_multiplier: 'อัตราค่าแรง',
    ot_multiplier: 'คูณ OT',
    extra_add: 'เงินเพิ่ม',
    extra_deduct: 'หักเงิน'
  };

  const exportToExcel = () => {
    if (records.length === 0) return Swal.fire({ icon: "warning", title: "ไม่มีข้อมูล", text: "ไม่มีข้อมูลสำหรับดาวน์โหลด" });

    const empInfo = employees.find(e => e.id === selectedEmpId);
    const monthName = selectedMonth !== null ? THAI_MONTHS[selectedMonth] : "ทุกเดือน";

    const excelData = records.map((rec) => {
      const row: any = { 'วันที่': rec.log_date };
      if (colVisibility.time_in_1) row['เข้าเช้า (08:00)'] = rec.time_in_1 || '-';
      if (colVisibility.time_out_1) row['ออกเช้า (12:00)'] = rec.time_out_1 || '-';
      if (colVisibility.time_in_2) row['เข้าบ่าย (13:00)'] = rec.time_in_2 || '-';
      if (colVisibility.time_out_2) row['ออกบ่าย (17:00)'] = rec.time_out_2 || '-';
      if (colVisibility.time_in_3) row['เข้า OT (17:00)'] = rec.time_in_3 || '-';
      if (colVisibility.time_out_3) row['ออก OT (21:00)'] = rec.time_out_3 || '-';
      if (colVisibility.calculated_ot) row['รวม OT (ชม.)'] = rec.calculated_ot > 0 ? rec.calculated_ot.toFixed(1) : '-';
      if (colVisibility.remark) row['หมายเหตุ'] = rec.remark || '-';
      if (colVisibility.pay_multiplier) row['อัตราค่าแรง'] = rec.pay_multiplier || '1.0';
      if (colVisibility.ot_multiplier) row['คูณ OT'] = rec.ot_multiplier || '1.0';
      if (colVisibility.extra_add) row['เงินเพิ่ม'] = rec.extra_add || '-';
      if (colVisibility.extra_deduct) row['หักเงิน'] = rec.extra_deduct || '-';
      return row;
    });

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'ข้อมูลการลงเวลา');

    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    saveAs(data, `เวลาเข้าออก_${empInfo?.full_name}_${monthName}_${viewYear + 543}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto font-sans print:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Link href={ROUTES.ATTENDANCE} className="text-slate-400 hover:text-indigo-600 dark:text-indigo-400 transition">&larr;</Link>
            จัดการเวลาเข้า-ออก (รายบุคคล) {selectedMonth !== null ? `เดือน ${THAI_MONTHS[selectedMonth]} ` : ''}ปี พ.ศ. {viewYear + 543}
          </h1>
          <p className="text-slate-500 mt-2 ml-10">เลือกพนักงานและเดือนเพื่อกรอกหรือแก้ไขเวลา (รองรับการกรอกข้อมูลบัตรตอกย้อนหลัง)</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">เลือกพนักงาน</label>
            <select
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                setSelectedMonth(null); 
              }}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium dark:text-slate-200"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.emp_code} - {emp.full_name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">เปลี่ยนปี (พ.ศ.)</label>
            <div className="flex items-center justify-between p-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg">
              <button 
                onClick={() => { setViewYear(y => y - 1); setSelectedMonth(null); }}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <div className="font-bold text-lg text-indigo-700 dark:text-indigo-400">
                {viewYear + 543}
              </div>
              <button 
                onClick={() => { setViewYear(y => y + 1); setSelectedMonth(null); }}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition"
              >
                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {selectedMonth !== null && (
            <div className="md:col-span-2 flex justify-end gap-2 mt-7">
              <button
                onClick={() => setSelectedMonth(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition"
              >
                ← กลับไปภาพรวมปี
              </button>
              <button
                onClick={exportToExcel}
                disabled={records.length === 0}
                className={`px-4 py-2 font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition text-sm ${records.length === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
              >
                📊 Excel
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition text-sm"
              >
                <Printer className="w-4 h-4" /> พิมพ์
              </button>
            </div>
          )}

        </div>

        {selectedMonth !== null && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ตั้งค่าการแสดงผล (ตาราง & พิมพ์ & Excel)</label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              {(Object.keys(colVisibility) as Array<keyof typeof colVisibility>).map(key => (
                <label key={key} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-indigo-600 transition">
                  <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-3 h-3" checked={colVisibility[key]} onChange={() => toggleCol(key)} />
                  {colLabels[key]}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedMonth === null && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 print:hidden">
          <h2 className="font-bold text-xl text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-500" />
            ภาพรวมการทำงาน ปี พ.ศ. {viewYear + 543}
          </h2>
          
          {isLoadingSummary ? (
            <div className="p-12 text-center text-slate-500 font-medium">กำลังโหลดข้อมูลภาพรวมปี...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {THAI_MONTHS.map((monthName, index) => {
                const stat = yearSummary[index] || { workDays: 0, otHours: 0 };
                const hasData = stat.workDays > 0 || stat.otHours > 0;
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedMonth(index)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group
                      ${hasData 
                        ? 'border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-800 hover:border-indigo-400' 
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <div className={`font-bold text-lg mb-2 ${hasData ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {monthName}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-slate-500 dark:text-slate-400">ทำงาน</span>
                        <span className={`font-bold ${stat.workDays > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {stat.workDays} วัน
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-slate-500 dark:text-slate-400">ยอด OT</span>
                        <span className={`font-bold ${stat.otHours > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                          {stat.otHours.toFixed(1)} ชม.
                        </span>
                      </div>
                    </div>

                    {hasData && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}


      {selectedMonth !== null && (
        <>
          <div className="hidden print:block mb-4 text-center">
            <h2 className="text-xl font-bold">รายงานเวลาทำงานรายบุคคล (บัตรตอก)</h2>
            <p className="mt-1">พนักงาน: {employees.find(e => e.id === selectedEmpId)?.full_name || ""} ({employees.find(e => e.id === selectedEmpId)?.emp_code || ""})</p>
            <p>เดือน: {THAI_MONTHS[selectedMonth]} {viewYear + 543}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden print:border-none print:shadow-none print:rounded-none print:overflow-visible">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center print:hidden">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-lg text-slate-700 dark:text-slate-200">
                  {THAI_MONTHS[selectedMonth]} {viewYear + 543}
                </h2>
                {records.filter(r => r.is_edited).length > 0 && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full animate-pulse">
                    กำลังบันทึกอัตโนมัติ...
                  </span>
                )}
              </div>
              <button 
                onClick={() => handleSave(false)} 
                className={`px-5 py-2 text-white font-bold rounded-lg transition shadow-sm flex items-center gap-2 text-sm ${records.some(r => r.is_edited) ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                <Save className="w-4 h-4" /> {records.some(r => r.is_edited) ? 'บังคับบันทึกทันที' : 'บันทึกแล้ว (ล่าสุด)'}
              </button>
            </div>
            
            <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/30 flex items-start gap-3 text-sm print:hidden">
              <span className="text-xl"></span>
              <div className="text-indigo-800 dark:text-indigo-300">
                <strong className="block mb-1 text-[13px]">เคล็ดลับการกรอกข้อมูลให้ไวขึ้น:</strong>
                <ul className="list-disc list-inside space-y-1 text-indigo-700 dark:text-indigo-400 text-xs">
                  <li>พิมพ์ตัวเลขติดกันได้เลย ไม่ต้องพิมพ์ <code className="bg-white dark:bg-slate-800 px-1 rounded text-indigo-600 font-mono">:</code> (เช่น พิมพ์ <code className="bg-white dark:bg-slate-800 px-1 rounded text-indigo-600 font-mono">0830</code> ➔ ระบบแก้เป็น <strong>08:30</strong> ให้เอง)</li>
                  <li>กดปุ่ม <kbd className="bg-white dark:bg-slate-800 border border-indigo-200 px-1.5 rounded text-indigo-600 font-mono shadow-sm">Tab</kbd> บนคีย์บอร์ดเพื่อเลื่อนไปช่องถัดไปโดยไม่ต้องใช้เมาส์คลิก</li>
                  <li>ข้อมูลจะ <strong>บันทึกให้อัตโนมัติ</strong> เมื่อพิมพ์เสร็จ (รอ 1.5 วินาที สังเกตแถบสีเหลืองจะหายไป)</li>
                </ul>
              </div>
            </div>

            {isLoadingDetail ? (
              <div className="p-16 text-center text-slate-500 font-medium">กำลังโหลดข้อมูลเดือน{THAI_MONTHS[selectedMonth]}...</div>
            ) : (
              <div className="overflow-x-auto max-h-[55vh] print:max-h-none print:overflow-visible">
                <style type="text/css" media="print">{`
                  @page { size: A4 landscape; margin: 10mm; }
                  table { border-collapse: collapse !important; width: 100% !important; }
                  th, td { border: 1px solid #000 !important; color: #000 !important; background-color: transparent !important; }
                  th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .print\\:hidden { display: none !important; }
                `}</style>
                <table className="min-w-full divide-y divide-slate-200 relative print:text-[11px] print:border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0 z-10 shadow-sm print:static print:shadow-none">
                    <tr>
                      <th className="px-4 py-3 print:px-1 print:py-1 text-left text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 sticky left-0 z-20 print:static bg-slate-100 dark:bg-slate-800 min-w-[100px] print:min-w-0">วันที่</th>
                      {colVisibility.time_in_1 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">เข้าเช้า (08:00)</th>}
                      {colVisibility.time_out_1 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200">ออกเช้า (12:00)</th>}
                      {colVisibility.time_in_2 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">เข้าบ่าย (13:00)</th>}
                      {colVisibility.time_out_2 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200">ออกบ่าย (17:00)</th>}
                      {colVisibility.time_in_3 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-orange-700 bg-orange-100/50 border-l border-orange-200">เข้า OT (17:00)</th>}
                      {colVisibility.time_out_3 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-orange-700 bg-orange-100/50">ออก OT (21:00)</th>}
                      {colVisibility.calculated_ot && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-orange-700 bg-orange-100/50 border-l border-orange-200">รวม OT (ชม.)</th>}
                      {colVisibility.remark && <th className="px-4 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">หมายเหตุ</th>}
                      {colVisibility.pay_multiplier && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-indigo-700 bg-indigo-50/50 border-l border-indigo-200">อัตราค่าแรง</th>}
                      {colVisibility.ot_multiplier && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-orange-700 bg-orange-50/50 border-l border-orange-200">คูณ OT</th>}
                      {colVisibility.extra_add && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-emerald-700 bg-emerald-50/50 border-l border-emerald-200">เงินเพิ่ม</th>}
                      {colVisibility.extra_deduct && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-rose-700 bg-rose-50/50 border-l border-rose-200">หักเงิน</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800 print:divide-slate-300">
                    {records.map((rec) => {
                      const isMissingPunch = (rec.time_in_1 && !rec.time_out_1) || (rec.time_in_2 && !rec.time_out_2);
                      const isAbsent = !rec.time_in_1 && !rec.time_out_1 && !rec.time_in_2 && !rec.time_out_2 && !rec.remark;

                      return (
                        <tr key={rec.log_date} className={`hover:bg-slate-50 dark:hover:bg-slate-900 transition ${rec.is_edited ? "bg-yellow-50 dark:bg-yellow-900/20" : ""} ${isMissingPunch ? "bg-red-50 dark:bg-red-900/20" : ""} ${rec.is_holiday ? "bg-orange-50/40 dark:bg-orange-900/20" : ""} print:bg-transparent`}>
                          <td className="px-4 py-2 print:px-1 print:py-1 text-sm print:text-[10px] font-bold text-slate-800 dark:text-slate-200 sticky left-0 print:static bg-white dark:bg-slate-800 print:bg-transparent border-r border-slate-100 dark:border-slate-700">
                            {parseInt(rec.log_date.split('-')[2], 10)} {THAI_MONTHS_SHORT[selectedMonth]} {viewYear + 543}
                            {rec.is_holiday && <div className="text-[10px] text-orange-600 font-bold bg-orange-100 rounded px-1 inline-block ml-1 mt-1">{rec.holiday_name}</div>}
                            {isAbsent && !rec.is_holiday && <div className="text-[10px] text-slate-400 font-normal ml-1 print:hidden">ไม่มีข้อมูล</div>}
                          </td>

                          {colVisibility.time_in_1 && (
                            <td className="px-1 py-1 print:px-0 print:py-1 text-center">
                              <div className="print:hidden">
                                <ThaiTimeInput value={rec.time_in_1} onChange={(val) => handleInputChange(rec.log_date, "time_in_1", val)} theme="indigo" isLate={rec.is_late} />
                              </div>
                              <div className={`hidden print:block text-[10px] ${rec.is_late ? 'text-rose-600 font-bold' : ''}`}>{rec.time_in_1 || "-"}</div>
                            </td>
                          )}
                          {colVisibility.time_out_1 && (
                            <td className="px-1 py-1 print:px-0 print:py-1 text-center">
                              <div className="print:hidden">
                                <ThaiTimeInput value={rec.time_out_1} onChange={(val) => handleInputChange(rec.log_date, "time_out_1", val)} theme="indigo" />
                              </div>
                              <div className="hidden print:block text-[10px]">{rec.time_out_1 || "-"}</div>
                            </td>
                          )}
                          {colVisibility.time_in_2 && (
                            <td className="px-1 py-1 print:px-0 print:py-1 text-center border-l border-slate-100 dark:border-slate-700">
                              <div className="print:hidden">
                                <ThaiTimeInput value={rec.time_in_2} onChange={(val) => handleInputChange(rec.log_date, "time_in_2", val)} theme="indigo" />
                              </div>
                              <div className="hidden print:block text-[10px]">{rec.time_in_2 || "-"}</div>
                            </td>
                          )}
                          {colVisibility.time_out_2 && (
                            <td className="px-1 py-1 print:px-0 print:py-1 text-center">
                              <div className="print:hidden">
                                <ThaiTimeInput value={rec.time_out_2} onChange={(val) => handleInputChange(rec.log_date, "time_out_2", val)} theme="indigo" />
                              </div>
                              <div className="hidden print:block text-[10px]">{rec.time_out_2 || "-"}</div>
                            </td>
                          )}

                          {colVisibility.time_in_3 && (
                            <td className="px-1 py-1 print:px-0 print:py-1 text-center bg-orange-50/20 print:bg-transparent border-l border-orange-100">
                              <div className="print:hidden">
                                <ThaiTimeInput value={rec.time_in_3} onChange={(val) => handleInputChange(rec.log_date, "time_in_3", val)} theme="orange" />
                              </div>
                              <div className="hidden print:block text-[10px]">{rec.time_in_3 || "-"}</div>
                            </td>
                          )}
                          {colVisibility.time_out_3 && (
                            <td className="px-1 py-1 print:px-0 print:py-1 text-center bg-orange-50/20 print:bg-transparent">
                              <div className="print:hidden">
                                <ThaiTimeInput value={rec.time_out_3} onChange={(val) => handleInputChange(rec.log_date, "time_out_3", val)} theme="orange" />
                              </div>
                              <div className="hidden print:block text-[10px]">{rec.time_out_3 || "-"}</div>
                            </td>
                          )}

                          {colVisibility.calculated_ot && (
                            <td className="px-1 py-1 print:px-0 print:py-1 text-center bg-orange-50/20 print:bg-transparent border-l border-orange-200">
                              <div className="font-bold text-xs text-orange-700 print:text-[10px]">
                                {rec.calculated_ot > 0 ? rec.calculated_ot.toFixed(1) : "-"}
                              </div>
                            </td>
                          )}

                          {colVisibility.remark && (
                            <td className="px-2 py-1 print:px-1 print:py-1 text-center border-l border-slate-100 dark:border-slate-700">
                              <input
                                type="text" placeholder="ระบุเหตุผล..."
                                className="w-full min-w-[100px] px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm bg-slate-50 dark:bg-slate-900 dark:text-slate-200 print:hidden"
                                value={rec.remark || ""}
                                onChange={(e) => handleInputChange(rec.log_date, "remark", e.target.value)}
                              />
                              <div className="hidden print:block text-[10px] truncate max-w-[100px]">{rec.remark || "-"}</div>
                            </td>
                          )}

                          {colVisibility.pay_multiplier && (
                            <td className="px-2 py-1 print:px-1 print:py-1 text-center border-l border-indigo-100 bg-indigo-50/10 print:bg-transparent">
                              <select
                                value={rec.pay_multiplier || 1.0}
                                onChange={(e) => handleInputChange(rec.log_date, "pay_multiplier", e.target.value)}
                                className={`w-full px-2 py-1.5 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm cursor-pointer print:hidden ${Number(rec.pay_multiplier) > 1.0 ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                              >
                                <option value="1.0">x1.0 (ปกติ)</option>
                                <option value="2.0">x2.0 (สองแรง)</option>
                              </select>
                              <div className="hidden print:block text-[10px]">{rec.pay_multiplier || "1"}</div>
                            </td>
                          )}

                          {colVisibility.ot_multiplier && (
                            <td className="px-2 py-1 print:px-1 print:py-1 text-center border-l border-orange-100 bg-orange-50/10 print:bg-transparent">
                              <select
                                value={rec.ot_multiplier || 1.0}
                                onChange={(e) => handleInputChange(rec.log_date, "ot_multiplier", e.target.value)}
                                className={`w-full px-2 py-1.5 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition shadow-sm cursor-pointer print:hidden ${Number(rec.ot_multiplier) > 1.0 ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                              >
                                <option value="1.0">x1.0</option>
                                <option value="1.5">x1.5</option>
                                <option value="2.0">x2.0</option>
                                <option value="3.0">x3.0</option>
                              </select>
                              <div className="hidden print:block text-[10px]">{rec.ot_multiplier || "1"}</div>
                            </td>
                          )}

                          {colVisibility.extra_add && (
                            <td className="px-2 py-1 print:px-1 print:py-1 text-center border-l border-emerald-100 bg-emerald-50/10 print:bg-transparent">
                              <input
                                type="number" placeholder="0" value={rec.extra_add || ''}
                                onChange={(e) => handleInputChange(rec.log_date, "extra_add", e.target.value)}
                                className="w-full min-w-[60px] px-2 py-1.5 text-xs font-bold border rounded-lg bg-slate-50 text-slate-700 border-slate-200 text-right print:hidden"
                              />
                              <div className="hidden print:block text-[10px]">{rec.extra_add || "-"}</div>
                            </td>
                          )}

                          {colVisibility.extra_deduct && (
                            <td className="px-2 py-1 print:px-1 print:py-1 text-center border-l border-rose-100 bg-rose-50/10 print:bg-transparent">
                              <input
                                type="number" placeholder="0" value={rec.extra_deduct || ''}
                                onChange={(e) => handleInputChange(rec.log_date, "extra_deduct", e.target.value)}
                                className="w-full min-w-[60px] px-2 py-1.5 text-xs font-bold border rounded-lg bg-slate-50 text-slate-700 border-slate-200 text-right print:hidden"
                              />
                              <div className="hidden print:block text-[10px]">{rec.extra_deduct || "-"}</div>
                            </td>
                          )}

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
