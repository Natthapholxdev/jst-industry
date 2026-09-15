"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Eye, ClipboardList, Edit, User, Smartphone, Building2, FolderOpen, MapPin, AlertTriangle, Wallet, FileText, CheckCircle, Save, Phone, Circle, UserCircle2, Clock, CalendarOff, LayoutDashboard, Settings, LogOut, BarChart3, Sun, Moon, Monitor, Flame, Calendar as CalendarIcon, Printer } from 'lucide-react';
import ThaiDatePicker from "@/components/ThaiDatePicker";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import * as xlsx from 'xlsx';
import { saveAs } from 'file-saver';

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

  let colorClass = theme === "orange" ? "text-orange-700 border-orange-500 ring-2 ring-orange-200" : "text-indigo-700 dark:text-indigo-300 border-indigo-500 ring-2 ring-indigo-200";
  let displayClass = theme === "orange" ? "bg-white dark:bg-slate-800 border-orange-200 hover:bg-orange-50 text-orange-700 cursor-pointer" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 cursor-pointer";

  if (isLate) {
    colorClass = "text-rose-700 dark:text-rose-300 border-rose-500 ring-2 ring-rose-200";
    displayClass = "bg-rose-50 dark:bg-rose-900/30 border-rose-200 hover:bg-rose-100 text-rose-700 dark:text-rose-400 cursor-pointer";
  }

  if (isEditing) {
    return (
      <input
        type="time" step="2" autoFocus
        className={`w-full min-w-[90px] px-1 py-1 text-xs font-bold text-center bg-white dark:bg-slate-800 border rounded outline-none transition-all shadow-sm ${colorClass}`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`w-full min-w-[90px] px-1 py-1 text-xs font-bold border rounded text-center transition-all shadow-sm ${displayClass}`}
      title="คลิกเพื่อแก้ไขเวลา"
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
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(1);
    return today.toISOString().split("T")[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    // Read empId from URL
    const params = new URLSearchParams(window.location.search);
    const empIdFromUrl = params.get('empId');

    const fetchEmployees = async () => {
      const { data } = await supabase
        .from('employees')
        .select('id, emp_code, full_name, shift_id')
        .eq('status', 'Active')
        .order('emp_code', { ascending: true });
        
      const { data: shiftsData } = await supabase.from('shifts').select('*');
      const { data: settingsData } = await supabase.from('shift_settings').select('ot_in_end').eq('id', 1).single();
      
      if (settingsData) setSettings(settingsData);
      if (shiftsData) setShifts(shiftsData);
      if (data) {
        setEmployees(data);
        if (empIdFromUrl && data.some(e => e.id === empIdFromUrl)) {
          setSelectedEmpId(empIdFromUrl);
          // Small timeout to wait for selectedEmpId state update
          setTimeout(() => {
             document.getElementById('fetchDataBtn')?.click();
          }, 300);
        } else if (data.length > 0) {
          setSelectedEmpId(data[0].id);
        }
      }
    };
    fetchEmployees();
  }, []);

  const setDateRange = (type: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    let start = "";
    let end = "";
    
    if (type === "1-15") {
      start = new Date(year, month, 1).toISOString().split("T")[0];
      end = new Date(year, month, 15).toISOString().split("T")[0];
    } else if (type === "16-31") {
      start = new Date(year, month, 16).toISOString().split("T")[0];
      end = new Date(year, month + 1, 0).toISOString().split("T")[0]; // วันสุดท้ายของเดือน
    } else if (type === "this_month") {
      start = new Date(year, month, 1).toISOString().split("T")[0];
      end = new Date(year, month + 1, 0).toISOString().split("T")[0];
    }
    
    setStartDate(start);
    setEndDate(end);
  };

  const fetchPersonRecords = async () => {
    if (!selectedEmpId || !startDate || !endDate) return;
    
    setIsLoading(true);
    try {
      // Create an array of all dates in the range
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
        .eq("employee_id", selectedEmpId)
        .gte("log_date", startDate)
        .lte("log_date", endDate);
        
      const { data: holidays } = await supabase
        .from("holidays")
        .select("*")
        .gte("holiday_date", startDate)
        .lte("holiday_date", endDate);
        
      const empInfo = employees.find(e => e.id === selectedEmpId);
        
      const combinedRecords = dateArray.map(dateStr => {
        const log = logs?.find(l => l.log_date === dateStr);
        const holiday = holidays?.find(h => h.holiday_date === dateStr);
        const dayOfWeek = new Date(dateStr).getDay();
        
        let defaultMultiplier = 1.0;
        if (holiday) {
          defaultMultiplier = holiday.multiplier || 2.0;
        }
        
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
        
        const in1 = timeToHours(log?.time_in_1);
        const out1 = timeToHours(log?.time_out_1);
        const in2 = timeToHours(log?.time_in_2);
        const out2 = timeToHours(log?.time_out_2);
        const in3 = timeToHours(log?.time_in_3);
        const out3 = timeToHours(log?.time_out_3);
        
        const otSettingStart = timeToHours(settings?.ot_in_end || empShift.ot_start_time);
        const pairs = [[in1, out1], [in2, out2], [in3, out3]];
        pairs.forEach(([tIn, tOut]) => {
          if (tIn > 0 && tOut > 0 && tOut > otSettingStart && log?.time_in_3 !== 'OT') {
            const actualOtStart = Math.max(tIn, otSettingStart);
            if (tOut > actualOtStart) dailyOT += (tOut - actualOtStart);
          }
        });

        return {
          log_date: dateStr,
          id: selectedEmpId,
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
      setIsLoading(false);
    }
  };

  const handleInputChange = (dateStr: string, field: string, value: string) => {
    setRecords(records.map((rec) =>
      rec.log_date === dateStr ? { ...rec, [field]: value, is_edited: true } : rec
    ));
  };

  const handleSave = async () => {
    const editedRecords = records.filter(r => r.is_edited);
    
    if (editedRecords.length === 0) {
      return Swal.fire({ icon: "info", title: "ไม่มีการเปลี่ยนแปลง", text: "ยังไม่มีการแก้ไขข้อมูล", confirmButtonColor: "#4f46e5" });
    }

    Swal.fire({
      title: "ยืนยันการบันทึก?",
      text: "ระบบจะบันทึกข้อมูลและประวัติการแก้ไข",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "ใช่, บันทึกข้อมูล",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({ title: "กำลังบันทึก...", allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

          // บันทึกทีละวัน
          for (const rec of editedRecords) {
            await fetch("/api/attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                date: rec.log_date, 
                records: [rec] // ส่งไปแค่คนเดียว
              }),
            });
          }

          Swal.fire({ icon: "success", title: "บันทึกสำเร็จ!", text: "อัพเดทข้อมูลเรียบร้อยแล้ว", confirmButtonColor: "#10b981" });
          fetchPersonRecords(); // ดึงใหม่เพื่อรีเซ็ต is_edited
        } catch (err) {
          Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด!", text: "ไม่สามารถบันทึกได้", confirmButtonColor: "#ef4444" });
        }
      }
    });
  };

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
    time_in_1: 'เข้าเช้า',
    time_out_1: 'ออกเที่ยง',
    time_in_2: 'เข้าบ่าย',
    time_out_2: 'เลิกงาน',
    time_in_3: 'เข้า OT',
    time_out_3: 'ออก OT',
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
    
    const excelData = records.map((rec) => {
      const row: any = { 'วันที่': rec.log_date };
      if (colVisibility.time_in_1) row['เข้าเช้า'] = rec.time_in_1 || '-';
      if (colVisibility.time_out_1) row['ออกเที่ยง'] = rec.time_out_1 || '-';
      if (colVisibility.time_in_2) row['เข้าบ่าย'] = rec.time_in_2 || '-';
      if (colVisibility.time_out_2) row['เลิกงาน'] = rec.time_out_2 || '-';
      if (colVisibility.time_in_3) row['เข้า OT'] = rec.time_in_3 || '-';
      if (colVisibility.time_out_3) row['ออก OT'] = rec.time_out_3 || '-';
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
    
    saveAs(data, `เวลาเข้าออก_${empInfo?.full_name}_${startDate}_ถึง_${endDate}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto font-sans print:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Link href="/attendance" className="text-slate-400 hover:text-indigo-600 dark:text-indigo-400 transition">&larr;</Link>
            จัดการเวลาเข้า-ออก (รายบุคคล)
          </h1>
          <p className="text-slate-500 mt-2 ml-10">ดูและแก้ไขเวลาการทำงานของพนักงานเป็นรายบุคคลตามช่วงเวลา</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">เลือกพนักงาน</label>
            <select 
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium dark:text-slate-200"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.emp_code} - {emp.full_name}</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ช่วงเวลา</label>
            <div className="flex items-center gap-2">
              <ThaiDatePicker value={startDate} onChange={setStartDate} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none dark:text-slate-200" />
              <span className="text-slate-400 font-bold">ถึง</span>
              <ThaiDatePicker value={endDate} onChange={setEndDate} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none dark:text-slate-200" />
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setDateRange("1-15")} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1 rounded font-bold transition">1-15</button>
              <button onClick={() => setDateRange("16-31")} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1 rounded font-bold transition">16-สิ้นเดือน</button>
              <button onClick={() => setDateRange("this_month")} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1 rounded font-bold transition">เดือนนี้ทั้งเดือน</button>
            </div>
          </div>
          
          <div className="md:col-span-2 flex flex-col gap-3">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">ตั้งค่าการแสดงผล (ตาราง & พิมพ์ & Excel)</label>
            <div className="flex flex-wrap gap-2 mb-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              {(Object.keys(colVisibility) as Array<keyof typeof colVisibility>).map(key => (
                <label key={key} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-indigo-600 transition">
                  <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-3 h-3" checked={colVisibility[key]} onChange={() => toggleCol(key)} />
                  {colLabels[key]}
                </label>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button 
                id="fetchDataBtn"
                onClick={fetchPersonRecords}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm py-2 transition text-sm"
              >
                <Search className="w-4 h-4" /> ดึงข้อมูล
              </button>
              <button 
                onClick={exportToExcel}
                disabled={records.length === 0}
                className={`flex-1 font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm py-2 transition text-sm ${records.length === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
              >
                📊 Excel
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm py-2 transition text-sm"
              >
                <Printer className="w-4 h-4" /> พิมพ์
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* หัวรายงานสำหรับ Print เท่านั้น */}
      <div className="hidden print:block mb-4 text-center">
        <h2 className="text-xl font-bold">รายงานเวลาทำงานรายบุคคล</h2>
        <p className="mt-1">
          พนักงาน: {employees.find(e => e.id === selectedEmpId)?.full_name || ""} ({employees.find(e => e.id === selectedEmpId)?.emp_code || ""})
        </p>
        <p>ช่วงเวลา: {startDate} ถึง {endDate}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden print:border-none print:shadow-none">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center print:hidden">
          <h2 className="font-bold text-slate-700 dark:text-slate-200">
            ข้อมูลการลงเวลา {records.length > 0 && `(พบ ${records.length} วัน)`}
          </h2>
          {records.filter(r => r.is_edited).length > 0 && (
             <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 text-sm">
               <Save className="w-4 h-4" /> บันทึกส่วนที่แก้ไข ({records.filter(r => r.is_edited).length} วัน)
             </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-slate-500 font-medium">กำลังโหลดข้อมูล...</div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-medium print:hidden">กรุณาเลือกพนักงานและวันที่ จากนั้นกด "ดึงข้อมูล"</div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] print:max-h-none print:overflow-visible">
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
                  <th className="px-4 py-3 print:px-1 print:py-1 text-left text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 sticky left-0 z-20 print:static bg-slate-100 dark:bg-slate-800 min-w-[120px] print:min-w-0">วันที่</th>
                  {colVisibility.time_in_1 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">เข้าเช้า</th>}
                  {colVisibility.time_out_1 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200">ออกเที่ยง</th>}
                  {colVisibility.time_in_2 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">เข้าบ่าย</th>}
                  {colVisibility.time_out_2 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200">เลิกงาน</th>}
                  {colVisibility.time_in_3 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-orange-700 bg-orange-100/50 border-l border-orange-200">เข้า OT</th>}
                  {colVisibility.time_out_3 && <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-orange-700 bg-orange-100/50">ออก OT</th>}
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
                    <tr key={rec.log_date} className={`hover:bg-slate-50 dark:hover:bg-slate-900 transition ${rec.is_edited ? "bg-yellow-50 dark:bg-yellow-900/20" : ""} ${isMissingPunch ? "bg-red-50 dark:bg-red-900/20" : ""} ${rec.is_holiday ? "bg-rose-50/30 dark:bg-rose-900/20" : ""} print:bg-transparent`}>
                      <td className="px-4 py-2 print:px-1 print:py-1 text-sm print:text-[10px] font-bold text-slate-800 dark:text-slate-200 sticky left-0 print:static bg-white dark:bg-slate-800 print:bg-transparent border-r border-slate-100 dark:border-slate-700">
                        {rec.log_date}
                        {rec.is_holiday && <div className="text-[10px] text-rose-600 font-bold bg-rose-100 rounded px-1 inline-block ml-1 mt-1">{rec.holiday_name}</div>}
                        {isAbsent && !rec.is_holiday && <div className="text-[10px] text-slate-400 font-normal ml-1">ไม่มีข้อมูล</div>}
                      </td>
                      
                      {/* วนลูปเวลาปกติ */}
                      {colVisibility.time_in_1 && (
                        <td className="px-1 py-2 print:px-0 print:py-1 text-center">
                          <div className="print:hidden">
                            <ThaiTimeInput value={rec.time_in_1} onChange={(val) => handleInputChange(rec.log_date, "time_in_1", val)} theme="indigo" isLate={rec.is_late} />
                          </div>
                          <div className={`hidden print:block text-[10px] ${rec.is_late ? 'text-rose-600 font-bold' : ''}`}>{rec.time_in_1 || "-"}</div>
                        </td>
                      )}
                      {colVisibility.time_out_1 && (
                        <td className="px-1 py-2 print:px-0 print:py-1 text-center">
                          <div className="print:hidden">
                            <ThaiTimeInput value={rec.time_out_1} onChange={(val) => handleInputChange(rec.log_date, "time_out_1", val)} theme="indigo" />
                          </div>
                          <div className="hidden print:block text-[10px]">{rec.time_out_1 || "-"}</div>
                        </td>
                      )}
                      {colVisibility.time_in_2 && (
                        <td className="px-1 py-2 print:px-0 print:py-1 text-center border-l border-slate-100 dark:border-slate-700">
                          <div className="print:hidden">
                            <ThaiTimeInput value={rec.time_in_2} onChange={(val) => handleInputChange(rec.log_date, "time_in_2", val)} theme="indigo" />
                          </div>
                          <div className="hidden print:block text-[10px]">{rec.time_in_2 || "-"}</div>
                        </td>
                      )}
                      {colVisibility.time_out_2 && (
                        <td className="px-1 py-2 print:px-0 print:py-1 text-center">
                          <div className="print:hidden">
                            <ThaiTimeInput value={rec.time_out_2} onChange={(val) => handleInputChange(rec.log_date, "time_out_2", val)} theme="indigo" />
                          </div>
                          <div className="hidden print:block text-[10px]">{rec.time_out_2 || "-"}</div>
                        </td>
                      )}

                      {/* วนลูปเวลา OT */}
                      {colVisibility.time_in_3 && (
                        <td className="px-1 py-2 print:px-0 print:py-1 text-center bg-orange-50/20 print:bg-transparent border-l border-orange-100">
                          <div className="print:hidden">
                            <ThaiTimeInput value={rec.time_in_3} onChange={(val) => handleInputChange(rec.log_date, "time_in_3", val)} theme="orange" />
                          </div>
                          <div className="hidden print:block text-[10px]">{rec.time_in_3 || "-"}</div>
                        </td>
                      )}
                      {colVisibility.time_out_3 && (
                        <td className="px-1 py-2 print:px-0 print:py-1 text-center bg-orange-50/20 print:bg-transparent">
                          <div className="print:hidden">
                            <ThaiTimeInput value={rec.time_out_3} onChange={(val) => handleInputChange(rec.log_date, "time_out_3", val)} theme="orange" />
                          </div>
                          <div className="hidden print:block text-[10px]">{rec.time_out_3 || "-"}</div>
                        </td>
                      )}
                      
                      {colVisibility.calculated_ot && (
                        <td className="px-1 py-2 print:px-0 print:py-1 text-center bg-orange-50/20 print:bg-transparent border-l border-orange-200">
                          <div className="font-bold text-xs text-orange-700 print:text-[10px]">
                            {rec.calculated_ot > 0 ? rec.calculated_ot.toFixed(1) : "-"}
                          </div>
                        </td>
                      )}

                      {colVisibility.remark && (
                        <td className="px-2 py-2 print:px-1 print:py-1 text-center border-l border-slate-100 dark:border-slate-700">
                          <input
                            type="text" placeholder="ระบุเหตุผล..."
                            className="w-full min-w-[120px] px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm bg-slate-50 dark:bg-slate-900 dark:text-slate-200 print:hidden"
                            value={rec.remark || ""}
                            onChange={(e) => handleInputChange(rec.log_date, "remark", e.target.value)}
                          />
                          <div className="hidden print:block text-[10px] truncate max-w-[100px]">{rec.remark || "-"}</div>
                        </td>
                      )}

                      {/* อัตราค่าแรง */}
                      {colVisibility.pay_multiplier && (
                        <td className="px-2 py-2 print:px-1 print:py-1 text-center border-l border-indigo-100 bg-indigo-50/10 print:bg-transparent">
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
                      
                      {/* ตัวคูณ OT */}
                      {colVisibility.ot_multiplier && (
                        <td className="px-2 py-2 print:px-1 print:py-1 text-center border-l border-orange-100 bg-orange-50/10 print:bg-transparent">
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
                      
                      {/* เงินเพิ่ม */}
                      {colVisibility.extra_add && (
                        <td className="px-2 py-2 print:px-1 print:py-1 text-center border-l border-emerald-100 bg-emerald-50/10 print:bg-transparent">
                          <input
                            type="number" placeholder="0" value={rec.extra_add || ''}
                            onChange={(e) => handleInputChange(rec.log_date, "extra_add", e.target.value)}
                            className="w-full min-w-[60px] px-2 py-1.5 text-xs font-bold border rounded-lg bg-slate-50 text-slate-700 border-slate-200 text-right print:hidden"
                          />
                          <div className="hidden print:block text-[10px]">{rec.extra_add || "-"}</div>
                        </td>
                      )}
                      
                      {/* หักเงิน */}
                      {colVisibility.extra_deduct && (
                        <td className="px-2 py-2 print:px-1 print:py-1 text-center border-l border-rose-100 bg-rose-50/10 print:bg-transparent">
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
    </div>
  );
}

