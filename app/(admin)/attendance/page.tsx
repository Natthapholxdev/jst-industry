"use client";
import { Plus, Search, Eye, ClipboardList, Edit, User, Smartphone, Building2, FolderOpen, MapPin, AlertTriangle, Wallet, FileText, CheckCircle, Save, Phone, Circle, UserCircle2, Clock, CalendarOff, LayoutDashboard, Settings, LogOut, BarChart3, Sun, Moon, Monitor, Flame } from 'lucide-react';

import { useState, useEffect } from "react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";
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
  const displayClass = theme === "orange" ? "bg-white dark:bg-slate-800 border-orange-200 hover:bg-orange-50 text-orange-700 cursor-pointer" : "bg-slate-50 dark:bg-slate-900 bborder-slate-200 dark:border-slate-700 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 cursor-pointer";

  if (isEditing) {
    return (
      <input
        type="time" step="2" autoFocus
        className={`w-full min-w-[100px] px-1 py-1.5 text-sm font-bold text-center bg-white dark:bg-slate-800 border-2 rounded-lg outline-none transition-all shadow-sm ${colorClass}`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`w-full min-w-[100px] px-2 py-2 text-sm font-bold border rounded-lg text-center transition-all shadow-sm ${displayClass}`}
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

  // เช็คว่าวันที่เลือก เป็นอดีตหรือไม่
  const todayStr = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
  const isPastDate = selectedDate < todayStr;

  const fetchRecords = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
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
    const editedRecords = records.filter((r) => r.is_edited);

    if (editedRecords.length === 0) {
      return Swal.fire({ icon: "info", title: "ไม่มีการเปลี่ยนแปลง", text: "คุณยังไม่ได้แก้ไขข้อมูลใดๆ", confirmButtonColor: "#4f46e5" });
    }

    const invalidRecord = editedRecords.find((rec) => !validateTimes(rec));
    if (invalidRecord) {
      return Swal.fire({ icon: "error", title: "ข้อมูลเวลาไม่ถูกต้อง!", text: `คุณกรอกเวลาออกงาน เร็วกว่าเวลาเข้างาน ของ ${invalidRecord.full_name} กรุณาตรวจสอบใหม่`, confirmButtonColor: "#ef4444" });
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
            body: JSON.stringify({ date: selectedDate, records: editedRecords }),
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

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-indigo-600 dark:text-indigo-400 transition">&larr;</Link>
            จัดการเวลาเข้า-ออก และ OT
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-300 rounded-lg overflow-hidden shadow-sm">
            <span className="px-3 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-r bborder-slate-200 dark:border-slate-700">วันที่</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 outline-none font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
            />
          </div>
          <FileUpload onSuccess={() => fetchRecords(selectedDate)} />
        </div>
      </div>

      {isPastDate && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl font-bold flex items-center gap-2 text-sm shadow-sm">
          <span>🛡️</span>
          โหมดดูข้อมูลย้อนหลัง: สามารถแก้ไขข้อมูลได้ แต่ระบบจะบันทึก "ประวัติการแก้ไข (Audit Log)" ทุกรายการเพื่อป้องกันการทุจริต
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border bborder-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b bborder-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
          <h2 className="font-bold text-slate-700 dark:text-slate-200">ข้อมูลประจำวันที่ {selectedDate}</h2>
          <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 dark:bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
            <Save className="w-5 h-5 mr-2 inline-block" /> บันทึกเวลา
          </button>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400">กำลังโหลดข้อมูลพนักงาน...</div>
        ) : (
          <div className="overflow-x-auto max-h-[65vh]">
            <table className="min-w-full divide-y divide-slate-200 relative">
              <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50 sticky left-0 z-20">รหัส</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50 sticky left-16 z-20 min-w-[150px]">ชื่อ-นามสกุล</th>
                  <th className="px-2 py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-200 border-l bborder-slate-200 dark:border-slate-700">เข้าเช้า</th>
                  <th className="px-2 py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-200">ออกเที่ยง</th>
                  <th className="px-2 py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-200">เข้าบ่าย</th>
                  <th className="px-2 py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-200">เลิกงาน</th>
                  <th className="px-2 py-3 text-center text-sm font-bold text-orange-700 bg-orange-100/50 border-l border-orange-200">เข้า OT (3)</th>
                  <th className="px-2 py-3 text-center text-sm font-bold text-orange-700 bg-orange-100/50">ออก OT (3)</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-200 border-l bborder-slate-200 dark:border-slate-700">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800">
                {records.map((emp) => {
                  // เช็คว่าลงเวลาแหว่งไหม (เช่น เข้าแต่ไม่ออก)
                  const isMissingPunch = (emp.time_in_1 && !emp.time_out_1) || 
                                         (emp.time_in_2 && !emp.time_out_2);
                  const isAbsent = !emp.time_in_1 && !emp.time_out_1 && !emp.time_in_2 && !emp.time_out_2 && !emp.remark;

                  return (
                    <tr key={emp.id} className={`hover:bg-slate-50 dark:bg-slate-900 transition ${emp.is_edited ? "bg-yellow-50" : ""} ${isMissingPunch ? "bg-red-50" : ""} ${isAbsent ? "opacity-50" : ""}`}>
                      <td className="px-4 py-2 text-sm font-bold text-slate-900 bg-white dark:bg-slate-800 sticky left-0">{emp.emp_code}</td>
                      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap bg-white dark:bg-slate-800 sticky left-16">
                        {emp.full_name}
                        {isMissingPunch && <span className="ml-2 text-xs font-bold text-red-500">⚠️ ลืมสแกนออก</span>}
                        {isAbsent && <span className="ml-2 text-xs font-bold text-slate-400">ยังไม่เข้างาน</span>}
                      </td>

                      {/* วนลูปเวลาปกติ */}
                      {["time_in_1", "time_out_1", "time_in_2", "time_out_2"].map((field, idx) => (
                        <td key={field} className={`px-1 py-2 text-center ${idx === 0 ? "border-l bborder-slate-100 dark:border-slate-700/50" : ""}`}>
                          <ThaiTimeInput
                            value={emp[field]}
                            onChange={(val) => handleInputChange(emp.id, field, val)}
                            theme="indigo"
                          />
                        </td>
                      ))}

                      {/* วนลูปเวลา OT */}
                      {["time_in_3", "time_out_3"].map((field, idx) => (
                        <td key={field} className={`px-1 py-2 text-center bg-orange-50/20 ${idx === 0 ? "border-l border-orange-100" : ""}`}>
                          <ThaiTimeInput
                            value={emp[field]}
                            onChange={(val) => handleInputChange(emp.id, field, val)}
                            theme="orange"
                          />
                        </td>
                      ))}

                      <td className="px-2 py-2 text-center border-l bborder-slate-100 dark:border-slate-700/50">
                        <input
                          type="text" placeholder="ระบุเหตุผล..."
                          className="w-full min-w-[120px] px-3 py-2 text-sm border bborder-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-800"
                          value={emp.remark || ""}
                          onChange={(e) => handleInputChange(emp.id, "remark", e.target.value)}
                        />
                      </td>
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