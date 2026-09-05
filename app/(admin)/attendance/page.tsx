"use client";
import { Plus, Search, Eye, ClipboardList, Edit, User, Smartphone, Building2, FolderOpen, MapPin, AlertTriangle, Wallet, FileText, CheckCircle, Save, Phone, Circle, UserCircle2, Clock, CalendarOff, LayoutDashboard, Settings, LogOut, BarChart3, Sun, Moon, Monitor, Flame, Printer } from 'lucide-react';

import { useState, useEffect } from "react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";
import ThaiDatePicker from "@/components/ThaiDatePicker";
import Swal from "sweetalert2";

// Component ผสมผสานป้ายแสดงผล + ช่องพิมพ์เวลา (เอา disabled ออกไปเลย เพื่อให้แก้ได้อิสระ)
const ThaiTimeInput = ({
  value,
  onChange,
  theme = "indigo",
}: {
  value: string;
  onChange: (val: string) => void;
  theme?: "indigo" | "orange";
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const colorClass = theme === "orange" ? "text-orange-700 border-orange-500 ring-2 ring-orange-200" : "text-indigo-700 dark:text-indigo-300 border-indigo-500 ring-2 ring-indigo-200";
  const displayClass = theme === "orange" ? "bg-white dark:bg-slate-800 border-orange-200 hover:bg-orange-50 text-orange-700 cursor-pointer" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 cursor-pointer";

  if (isEditing) {
    return (
      <input
        type="time" step="2" autoFocus
        className={`w-full min-w-[75px] px-1 py-1.5 text-sm font-bold text-center bg-white dark:bg-slate-800 border-2 rounded-lg outline-none transition-all shadow-sm ${colorClass}`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`w-full min-w-[75px] px-2 py-2 text-sm font-bold border rounded-lg text-center transition-all shadow-sm ${displayClass}`}
      title="คลิกเพื่อแก้ไขเวลา"
    >
      {value ? (
        <span className="flex items-center justify-center gap-1">
          {value} <span className="text-[10px] opacity-70 font-normal">น.</span>
        </span>
      ) : (
        <span className="text-slate-400 font-medium">-</span>
      )}
    </div>
  );
};

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(today.getHours() + 7);
    return today.toISOString().split("T")[0];
  });

  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 State สำหรับระบบ 2 แรง / วันหยุด
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayInfo, setHolidayInfo] = useState<any>(null);
  const [showSpecialPayOnly, setShowSpecialPayOnly] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);

  // เช็คว่าวันที่เลือก เป็นอดีตหรือไม่
  const todayStr = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
  const isPastDate = selectedDate < todayStr;

  const handleBulkMultiplier = (multiplier: string) => {
    setRecords(records.map(rec => 
      selectedEmpIds.includes(rec.id) ? { ...rec, pay_multiplier: multiplier, is_edited: true } : rec
    ));
    setSelectedEmpIds([]); // เคลียร์ค่าที่เลือกหลังจากกด
  };

  const fetchRecords = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setIsHoliday(data.isHoliday || false);
        setHolidayInfo(data.holidayInfo || null);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(selectedDate);
  }, [selectedDate]);

  const handleInputChange = (empId: string | number, field: string, value: string) => {
    setRecords(records.map((rec) =>
      rec.id === empId ? { ...rec, [field]: value, is_edited: true } : rec
    ));
  };

  const validateTimes = (rec: any) => {
    const toMin = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    if (rec.time_in_1 && rec.time_out_1 && toMin(rec.time_out_1) <= toMin(rec.time_in_1)) return false;
    if (rec.time_in_2 && rec.time_out_2 && toMin(rec.time_out_2) <= toMin(rec.time_in_2)) return false;
    if (rec.time_in_3 && rec.time_out_3 && toMin(rec.time_out_3) <= toMin(rec.time_in_3)) return false;
    return true;
  };

  const handleSave = async () => {
    // ใช้ records ทั้งหมดในการเช็คและบันทึก เพื่อให้กดบันทึกได้ตลอด
    const recordsToSave = records;

    if (recordsToSave.length === 0) {
      return Swal.fire({ icon: "info", title: "ไม่มีข้อมูล", text: "ไม่มีข้อมูลพนักงานสำหรับบันทึก", confirmButtonColor: "#4f46e5" });
    }

    const invalidRecord = recordsToSave.find((rec) => !validateTimes(rec));
    const missingPunchRecord = recordsToSave.find((rec) => (rec.time_in_1 && !rec.time_out_1) || (rec.time_in_2 && !rec.time_out_2));
    
    let warningHtml = "";
    if (invalidRecord) {
      warningHtml += `พบข้อมูลเวลาออกงานเร็วกว่าเข้างาน (เช่น ${invalidRecord.full_name})<br/>`;
    }
    if (missingPunchRecord) {
      warningHtml += `พบข้อมูลลืมสแกนออก (เช่น ${missingPunchRecord.full_name})<br/>`;
    }

    if (warningHtml) {
      const confirmProceed = await Swal.fire({
        icon: "warning",
        title: "ข้อมูลเวลาไม่สมบูรณ์!",
        html: `${warningHtml}<br/><b>คุณต้องการบันทึกข้อมูลต่อไปหรือไม่?</b>`,
        showCancelButton: true,
        confirmButtonColor: "#f59e0b",
        cancelButtonColor: "#64748b",
        confirmButtonText: "บันทึกต่อไป",
        cancelButtonText: "กลับไปแก้ไข",
      });
      if (!confirmProceed.isConfirmed) return;
    }

    Swal.fire({
      title: "ยืนยันการบันทึก?",
      text: isPastDate ? "คุณกำลังแก้ไขข้อมูลย้อนหลัง ระบบจะบันทึกประวัติการแก้ไขนี้ไว้เพื่อป้องกันการทุจริต" : "ตรวจสอบข้อมูลการลงเวลาให้ถูกต้องก่อนบันทึก",
      icon: isPastDate ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "ใช่, บันทึกข้อมูล",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({ title: "กำลังบันทึก...", allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

          const res = await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: selectedDate, records: recordsToSave }),
          });

          if (res.ok) {
            Swal.fire({ icon: "success", title: "บันทึกสำเร็จ!", text: "ข้อมูลถูกบันทึก และจัดเก็บประวัติการแก้ไขแล้ว", confirmButtonColor: "#10b981" });
            fetchRecords(selectedDate);
          } else {
            throw new Error();
          }
        } catch (err) {
          Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด!", text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", confirmButtonColor: "#ef4444" });
        }
      }
    });
  };

  const filteredRecords = records.filter(emp => {
    if (showSpecialPayOnly) {
      return Number(emp.pay_multiplier) > 1.0;
    }
    return true;
  });

  return (
    <div className="p-2 sm:p-4 max-w-full w-full mx-auto font-sans print:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-indigo-600 dark:text-indigo-400 transition">&larr;</Link>
            จัดการเวลาเข้า-ออก และ OT
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/attendance-person" className="px-3 py-2 rounded-lg font-bold text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition shadow-sm flex items-center gap-2">
            <User className="w-4 h-4" /> ดูรายบุคคล
          </Link>
          <button 
            onClick={() => window.print()}
            className="px-3 py-2 rounded-lg font-bold text-sm bg-slate-600 text-white hover:bg-slate-700 transition shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> พิมพ์
          </button>
          <button 
            onClick={() => setShowSpecialPayOnly(!showSpecialPayOnly)}
            className={`px-3 py-2 rounded-lg font-bold text-sm border transition shadow-sm flex items-center gap-2 ${showSpecialPayOnly ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300'}`}
          >
            <Flame className="w-4 h-4" /> 
            {showSpecialPayOnly ? 'แสดงทั้งหมด' : 'ดูเฉพาะได้ค่าแรงพิเศษ'}
          </button>
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-300 rounded-lg overflow-hidden shadow-sm">
            <span className="px-3 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 h-full flex items-center">วันที่</span>
            <ThaiDatePicker
              value={selectedDate}
              onChange={(val) => setSelectedDate(val)}
              className="p-2 outline-none dark:bg-slate-800 dark:text-white"
            />
          </div>
          <FileUpload onSuccess={() => fetchRecords(selectedDate)} />
        </div>
      </div>

      {/* หัวรายงานสำหรับ Print เท่านั้น */}
      <div className="hidden print:block mb-4 text-center">
        <h2 className="text-xl font-bold">รายงานเวลาทำงานประจำวัน</h2>
        <p className="mt-1">วันที่: {selectedDate}</p>
      </div>

      {isHoliday && holidayInfo && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-2 text-sm shadow-sm print:hidden">
          <span>🎉</span>
          วันนี้เป็นวันหยุดพิเศษ: {holidayInfo.name} (อัตราค่าแรงอัตโนมัติ x{holidayInfo.multiplier})
        </div>
      )}

      {isPastDate && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl font-bold flex items-center gap-2 text-sm shadow-sm print:hidden">
          <span>🛡️</span>
          โหมดดูข้อมูลย้อนหลัง: สามารถแก้ไขข้อมูลได้ แต่ระบบจะบันทึก "ประวัติการแก้ไข (Audit Log)" ทุกรายการเพื่อป้องกันการทุจริต
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden print:border-none print:shadow-none">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center flex-wrap gap-4 print:hidden">
          <h2 className="font-bold text-slate-700 dark:text-slate-200">ข้อมูลประจำวันที่ {selectedDate}</h2>
          
          <div className="flex items-center gap-3">
            {selectedEmpIds.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 animate-in fade-in zoom-in-95 shadow-sm">
                <span className="text-sm font-bold text-indigo-700">เลือก {selectedEmpIds.length} รายการ:</span>
                <button 
                  onClick={() => handleBulkMultiplier('2.0')}
                  className="px-3 py-1 bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold transition shadow-sm"
                >
                  ตั้งเป็น 2 แรง
                </button>
                <button 
                  onClick={() => handleBulkMultiplier('1.0')}
                  className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-bold transition shadow-sm"
                >
                  ตั้งเป็นปกติ (x1)
                </button>
              </div>
            )}
            <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 dark:bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
              <Save className="w-5 h-5 mr-2 inline-block" /> บันทึกเวลา
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400">กำลังโหลดข้อมูลพนักงาน...</div>
        ) : (
          <div className="overflow-x-auto max-h-[65vh] print:max-h-none print:overflow-visible">
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
                  <th className="px-4 py-3 print:px-1 print:py-1 text-left text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50 sticky left-0 z-20 print:static">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer print:hidden"
                        checked={filteredRecords.length > 0 && selectedEmpIds.length === filteredRecords.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmpIds(filteredRecords.map(r => r.id));
                          } else {
                            setSelectedEmpIds([]);
                          }
                        }}
                      />
                      <span>รหัส</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 print:px-1 print:py-1 text-left text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50 sticky left-16 z-20 print:static min-w-[110px] lg:min-w-[150px] print:min-w-0">ชื่อ-นามสกุล</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">เข้าเช้า</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200">ออกเที่ยง</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">เข้าบ่าย</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200">เลิกงาน</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-orange-700 bg-orange-100/50 border-l border-orange-200">เข้า OT</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-orange-700 bg-orange-100/50">ออก OT</th>
                  <th className="px-4 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">หมายเหตุ</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-indigo-700 bg-indigo-50/50 border-l border-indigo-200 min-w-[85px] lg:min-w-[110px] print:min-w-0">อัตราค่าแรง</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-orange-700 bg-orange-50/50 border-l border-orange-200 min-w-[85px] lg:min-w-[110px] print:min-w-0">ตัวคูณ OT</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-emerald-700 bg-emerald-50/50 border-l border-emerald-200 min-w-[85px] lg:min-w-[110px] print:min-w-0">เงินเพิ่ม (฿)</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-rose-700 bg-rose-50/50 border-l border-rose-200 min-w-[85px] lg:min-w-[110px] print:min-w-0">หักเงิน (฿)</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-indigo-700 bg-indigo-100/50 border-l border-indigo-200">เข้าพิเศษ</th>
                  <th className="px-2 py-3 print:px-1 print:py-1 text-center text-sm print:text-xs font-bold text-indigo-700 bg-indigo-100/50">ออกพิเศษ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800 print:divide-slate-300">
                {filteredRecords.map((emp) => {
                  // เช็คว่าลงเวลาแหว่งไหม (เช่น เข้าแต่ไม่ออก)
                  const isMissingPunch = (emp.time_in_1 && !emp.time_out_1) || 
                                         (emp.time_in_2 && !emp.time_out_2);
                  const isAbsent = !emp.time_in_1 && !emp.time_out_1 && !emp.time_in_2 && !emp.time_out_2 && !emp.remark;

                  return (
                    <tr key={emp.id} className={`hover:bg-slate-50 dark:bg-slate-900 transition ${emp.is_edited ? "bg-yellow-50" : ""} ${isMissingPunch ? "bg-red-50" : ""} ${isAbsent ? "opacity-50" : ""} print:bg-transparent print:opacity-100`}>
                      <td className="px-4 py-2 print:px-1 print:py-1 text-sm print:text-[10px] font-bold text-slate-900 bg-white dark:bg-slate-800 print:bg-transparent sticky left-0 print:static">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer print:hidden"
                            checked={selectedEmpIds.includes(emp.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmpIds([...selectedEmpIds, emp.id]);
                              } else {
                                setSelectedEmpIds(selectedEmpIds.filter(id => id !== emp.id));
                              }
                            }}
                          />
                          {emp.emp_code}
                        </div>
                      </td>
                      <td className="px-4 py-2 print:px-1 print:py-1 text-sm print:text-[10px] text-slate-700 dark:text-slate-200 whitespace-nowrap bg-white dark:bg-slate-800 print:bg-transparent sticky left-16 print:static">
                        {emp.full_name}
                        {isMissingPunch && <span className="ml-2 text-xs font-bold text-red-500 print:hidden">⚠️ ลืมสแกนออก</span>}
                        {isAbsent && <span className="ml-2 text-xs font-bold text-slate-400 print:hidden">ยังไม่เข้างาน</span>}
                      </td>

                      {/* วนลูปเวลาปกติ */}
                      {["time_in_1", "time_out_1", "time_in_2", "time_out_2"].map((field, idx) => (
                        <td key={field} className={`px-1 py-2 print:px-0 print:py-1 text-center ${idx === 0 ? "border-l border-slate-100 dark:border-slate-700/50" : ""}`}>
                          <div className="print:hidden">
                            <ThaiTimeInput
                              value={emp[field]}
                              onChange={(val) => handleInputChange(emp.id, field, val)}
                              theme="indigo"
                            />
                          </div>
                          <div className="hidden print:block text-[10px]">{emp[field] || "-"}</div>
                        </td>
                      ))}

                      {/* วนลูปเวลา OT */}
                      {["time_in_3", "time_out_3"].map((field, idx) => (
                        <td key={field} className={`px-1 py-2 print:px-0 print:py-1 text-center bg-orange-50/20 print:bg-transparent ${idx === 0 ? "border-l border-orange-100" : ""}`}>
                          <div className="print:hidden">
                            <ThaiTimeInput
                              value={emp[field]}
                              onChange={(val) => handleInputChange(emp.id, field, val)}
                              theme="orange"
                            />
                          </div>
                          <div className="hidden print:block text-[10px]">{emp[field] || "-"}</div>
                        </td>
                      ))}

                      <td className="px-2 py-2 print:px-1 print:py-1 text-center border-l border-slate-100 dark:border-slate-700/50">
                        <input
                          type="text" placeholder="ระบุเหตุผล..."
                          className="w-full min-w-[120px] px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-800 print:hidden"
                          value={emp.remark || ""}
                          onChange={(e) => handleInputChange(emp.id, "remark", e.target.value)}
                        />
                        <div className="hidden print:block text-[10px] truncate max-w-[100px]">{emp.remark || "-"}</div>
                      </td>

                      <td className="px-2 py-2 print:px-1 print:py-1 text-center border-l border-indigo-100 bg-indigo-50/10 print:bg-transparent">
                        <select
                          value={emp.pay_multiplier || 1.0}
                          onChange={(e) => handleInputChange(emp.id, "pay_multiplier", e.target.value)}
                          className={`w-full px-2 py-1.5 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm cursor-pointer print:hidden ${Number(emp.pay_multiplier) > 1.0 ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                        >
                          <option value="1.0">x1.0 (ปกติ)</option>
                          <option value="2.0">x2.0 (สองแรง)</option>
                        </select>
                        <div className="hidden print:block text-[10px]">{emp.pay_multiplier || "1"}</div>
                        {emp.is_weekly_day_off && !isHoliday && (
                          <div className="text-[9px] text-orange-600 font-bold mt-1 bg-orange-100 rounded-full px-1 print:hidden">วันหยุดสัปดาห์</div>
                        )}
                      </td>
                      {/* ตัวคูณ OT */}
                      <td className="px-2 py-2 print:px-1 print:py-1 text-center border-l border-orange-100 bg-orange-50/10 print:bg-transparent">
                        <select
                          value={emp.ot_multiplier || 1.0}
                          onChange={(e) => handleInputChange(emp.id, "ot_multiplier", e.target.value)}
                          className={`w-full px-2 py-1.5 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition shadow-sm cursor-pointer print:hidden ${Number(emp.ot_multiplier) > 1.0 ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                        >
                          <option value="1.0">x1.0</option>
                          <option value="1.5">x1.5</option>
                          <option value="2.0">x2.0</option>
                          <option value="3.0">x3.0</option>
                        </select>
                        <div className="hidden print:block text-[10px]">{emp.ot_multiplier || "1"}</div>
                      </td>
                      {/* เงินเพิ่ม */}
                      <td className="px-2 py-2 print:px-1 print:py-1 text-center border-l border-emerald-100 bg-emerald-50/10 print:bg-transparent">
                        <input
                          type="number"
                          placeholder="0"
                          value={emp.extra_add || ''}
                          onChange={(e) => handleInputChange(emp.id, "extra_add", e.target.value)}
                          className="w-full min-w-[60px] px-2 py-1.5 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition shadow-sm bg-slate-50 text-slate-700 border-slate-200 print:hidden"
                        />
                        <div className="hidden print:block text-[10px]">{emp.extra_add || "-"}</div>
                      </td>
                      {/* หักเงิน */}
                      <td className="px-2 py-2 print:px-1 print:py-1 text-center border-l border-rose-100 bg-rose-50/10 print:bg-transparent">
                        <input
                          type="number"
                          placeholder="0"
                          value={emp.extra_deduct || ''}
                          onChange={(e) => handleInputChange(emp.id, "extra_deduct", e.target.value)}
                          className="w-full min-w-[60px] px-2 py-1.5 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition shadow-sm bg-slate-50 text-slate-700 border-slate-200 print:hidden"
                        />
                        <div className="hidden print:block text-[10px]">{emp.extra_deduct || "-"}</div>
                      </td>

                      {/* วนลูปเวลาพิเศษ (4) ย้ายมาท้ายสุด */}
                      {["time_in_4", "time_out_4"].map((field, idx) => (
                        <td key={field} className={`px-1 py-2 print:px-0 print:py-1 text-center bg-indigo-50/20 print:bg-transparent ${idx === 0 ? "border-l border-indigo-100" : ""}`}>
                          <div className="print:hidden">
                            <ThaiTimeInput
                              value={emp[field]}
                              onChange={(val) => handleInputChange(emp.id, field, val)}
                              theme="indigo"
                            />
                          </div>
                          <div className="hidden print:block text-[10px]">{emp[field] || "-"}</div>
                        </td>
                      ))}
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