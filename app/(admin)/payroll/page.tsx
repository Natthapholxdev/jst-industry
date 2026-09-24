'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calculator,
  FileSpreadsheet,
  CheckCircle2,
  Clock3,
  DollarSign,
  Users,
  TrendingUp,
  Gift,
  MinusCircle,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import * as xlsx from 'xlsx';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/routes';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Employee {
  id: string;
  emp_code: string;
  full_name: string;
  department: string;
  base_salary: number;
  ot_hourly_rate: number;
  status: string;
}

interface AttendanceLog {
  id: number;
  employee_id: string;
  log_date: string;
  time_in_1?: string;
  time_out_1?: string;
  time_in_3?: string;
  time_out_3?: string;
}

interface PayrollItem {
  employee_id: string;
  emp_code: string;
  full_name: string;
  department: string;
  base_salary: number;
  ot_hourly_rate: number;
  ot_hours: number;
  ot_pay: number;
  absent_days: number;
  absent_deduct: number;
  bonus: number;
  net_pay: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
/** แปลงเวลา "HH:MM" หรือ "HH.MM" เป็นชั่วโมงทศนิยม */
const timeToHours = (t?: string): number => {
  if (!t || t === '-' || t === '') return 0;
  const clean = t.replace('.', ':').trim();
  if (!clean.includes(':')) {
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  }
  const [h, m] = clean.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
};

/** คำนวณจำนวนวันทำงาน (จันทร์–ศุกร์) ในช่วงเดือน */
const getWorkingDays = (year: number, month: number): string[] => {
  const days: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) {
      days.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
  }
  return days;
};

/** แปลงเลขเดือน (1-12) เป็นชื่อไทย */
const MONTH_NAMES_TH = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

/** ฟอร์แมตตัวเลขเป็น "1,234.56" */
const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function PayrollPage() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);   // 1–12
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());       // ค.ศ.

  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [payrollStatus, setPayrollStatus] = useState<'Draft' | 'Approved'>('Draft');

  // เตรียมรายการปี (พ.ศ.) ให้เลือก ย้อนหลัง 5 ปี
  const thaiYears = Array.from({ length: 6 }, (_, i) => selectedYear - 2 + i); // ค.ศ. range

  // ─── Summary Cards ───────────────────────────
  const totalBaseSalary = payrollItems.reduce((s, i) => s + i.base_salary, 0);
  const totalOTPay = payrollItems.reduce((s, i) => s + i.ot_pay, 0);
  const totalBonus = payrollItems.reduce((s, i) => s + i.bonus, 0);
  const totalDeduct = payrollItems.reduce((s, i) => s + i.absent_deduct, 0);
  const totalNet = payrollItems.reduce((s, i) => s + i.net_pay, 0);

  // ─── คำนวณอัตโนมัติ ──────────────────────────
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    try {
      // 1. Fetch employees
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('id, emp_code, full_name, department, base_salary, ot_hourly_rate, status')
        .eq('status', 'Active')
        .order('emp_code', { ascending: true });

      if (empError) throw empError;
      if (!empData || empData.length === 0) {
        Swal.fire({ icon: 'info', title: 'ไม่พบข้อมูลพนักงาน', text: 'กรุณาเพิ่มพนักงานก่อนคำนวณเงินเดือน' });
        return;
      }

      // 2. Fetch attendance_logs for the period
      const periodStart = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const periodEnd = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;

      const { data: logsData, error: logsError } = await supabase
        .from('attendance_logs')
        .select('id, employee_id, log_date, time_in_1, time_out_1, time_in_3, time_out_3')
        .gte('log_date', periodStart)
        .lte('log_date', periodEnd);

      if (logsError) throw logsError;
      const logs: AttendanceLog[] = logsData || [];

      // 3. คำนวณวันทำงาน (จ–ศ) ของเดือนนั้น
      const workingDays = getWorkingDays(selectedYear, selectedMonth);

      // 4. Build payroll items
      const items: PayrollItem[] = (empData as Employee[]).map((emp) => {
        const empLogs = logs.filter((l) => l.employee_id === emp.id);

        // — OT: นับชั่วโมงจาก time_in_3/time_out_3 —
        let otHours = 0;
        empLogs.forEach((log) => {
          // กรณี manual OT บันทึกตัวเลขชั่วโมงตรงใน time_out_3
          if (log.time_in_3 === 'OT') {
            otHours += Number(log.time_out_3) || 0;
          } else {
            const inT = timeToHours(log.time_in_3);
            const outT = timeToHours(log.time_out_3);
            if (outT > inT && inT > 0) {
              otHours += outT - inT;
            }
          }
        });

        // — Absent: วันทำงานที่ไม่มี attendance log —
        const presentDates = new Set(empLogs.filter((l) => l.time_in_1 && l.time_in_1 !== '-').map((l) => l.log_date));
        const absentDays = workingDays.filter((d) => !presentDates.has(d)).length;

        // — คำนวณเงิน —
        const dailyRate = emp.base_salary > 0 ? emp.base_salary / workingDays.length : 0;
        const otPay = otHours * (emp.ot_hourly_rate || 0);
        const absentDeduct = absentDays * dailyRate;
        const bonus = 0; // ให้แก้ไขได้ในตาราง
        const netPay = emp.base_salary + otPay - absentDeduct + bonus;

        return {
          employee_id: emp.id,
          emp_code: emp.emp_code,
          full_name: emp.full_name,
          department: emp.department || 'ไม่ระบุ',
          base_salary: emp.base_salary || 0,
          ot_hourly_rate: emp.ot_hourly_rate || 0,
          ot_hours: Math.round(otHours * 100) / 100,
          ot_pay: Math.round(otPay * 100) / 100,
          absent_days: absentDays,
          absent_deduct: Math.round(absentDeduct * 100) / 100,
          bonus,
          net_pay: Math.round(netPay * 100) / 100,
        };
      });

      setPayrollItems(items);
      setIsCalculated(true);
      setPayrollStatus('Draft');

      Swal.fire({
        icon: 'success',
        title: 'คำนวณสำเร็จ',
        text: `คำนวณเงินเดือนสำหรับ ${items.length} คน เดือน ${MONTH_NAMES_TH[selectedMonth]} ${selectedYear + 543}`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('Payroll calculation error:', error);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message || 'ไม่สามารถคำนวณได้' });
    } finally {
      setIsCalculating(false);
    }
  }, [selectedMonth, selectedYear]);

  // ─── แก้ไขโบนัสในตาราง ───────────────────────
  const handleBonusChange = (employeeId: string, value: string) => {
    const bonus = parseFloat(value) || 0;
    setPayrollItems((prev) =>
      prev.map((item) => {
        if (item.employee_id !== employeeId) return item;
        const netPay = item.base_salary + item.ot_pay - item.absent_deduct + bonus;
        return { ...item, bonus, net_pay: Math.round(netPay * 100) / 100 };
      })
    );
  };

  // ─── อนุมัติ (เก็บใน State เท่านั้น) ─────────
  const handleApprove = async () => {
    const result = await Swal.fire({
      title: 'ยืนยันการอนุมัติเงินเดือน?',
      html: `<b>เดือน ${MONTH_NAMES_TH[selectedMonth]} ${selectedYear + 543}</b><br/>รวมจ่ายทั้งสิ้น <b>${fmt(totalNet)} ฿</b>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#007AFF',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'อนุมัติ',
      cancelButtonText: 'ยกเลิก',
    });
    if (!result.isConfirmed) return;

    // TODO: Save to DB when payroll_runs / payroll_items tables are created
    // Example:
    // const { data: run } = await supabase.from('payroll_runs').insert([{ month: selectedMonth, year: selectedYear, status: 'Approved' }]).select().single();
    // await supabase.from('payroll_items').insert(payrollItems.map(i => ({ ...i, payroll_run_id: run.id })));
    //
    // ถ้า insert ล้มเหลว ให้แสดง note นี้:
    // Swal.fire({ icon: 'info', title: 'หมายเหตุ', text: 'กรุณาติดต่อ Admin เพื่อสร้างตาราง payroll_runs ใน Supabase' });

    setPayrollStatus('Approved');
    Swal.fire({
      icon: 'success',
      title: 'อนุมัติสำเร็จ',
      text: 'บันทึกสถานะ Approved เรียบร้อยแล้ว (เก็บใน State ชั่วคราว)',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  // ─── Export Excel ─────────────────────────────
  const handleExportExcel = () => {
    if (payrollItems.length === 0) {
      return Swal.fire({ icon: 'warning', title: 'ไม่มีข้อมูล', text: 'กรุณาคำนวณเงินเดือนก่อนส่งออก' });
    }

    const rows = payrollItems.map((item, idx) => ({
      'ลำดับ': idx + 1,
      'รหัสพนักงาน': item.emp_code,
      'ชื่อ-นามสกุล': item.full_name,
      'แผนก': item.department,
      'เงินเดือนฐาน (฿)': item.base_salary,
      'ชั่วโมง OT': item.ot_hours,
      'เงิน OT (฿)': item.ot_pay,
      'วันขาด (วัน)': item.absent_days,
      'หักขาดงาน (฿)': item.absent_deduct,
      'โบนัส (฿)': item.bonus,
      'เงินสุทธิ (฿)': item.net_pay,
    }));

    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Payroll');

    // เพิ่ม meta row ด้านบน
    xlsx.utils.sheet_add_aoa(ws, [
      [`สรุปเงินเดือน เดือน ${MONTH_NAMES_TH[selectedMonth]} ${selectedYear + 543}`],
      [`สถานะ: ${payrollStatus}`],
      [],
    ], { origin: 'A1' });

    const buf = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto min-h-screen animate-in fade-in duration-500">

      {/* ══════════════════ HEADER ══════════════════ */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--apple-text-primary)] flex items-center gap-3">
            <Link
              href={ROUTES.DASHBOARD}
              className="text-[var(--apple-text-secondary)] hover:text-apple-blue transition"
              title="กลับหน้าหลัก"
            >
              <ArrowLeft className="w-7 h-7" />
            </Link>
            ระบบจัดการเงินเดือน
          </h1>
          <p className="text-[var(--apple-text-secondary)] mt-1 ml-10 font-medium">
            คำนวณ ตรวจสอบ และออกเงินเดือนพนักงานรายเดือน
          </p>
        </div>

        {/* Status Badge */}
        {isCalculated && (
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[980px] text-sm font-bold border shadow-sm ${
              payrollStatus === 'Approved'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
            }`}
          >
            {payrollStatus === 'Approved' ? <CheckCircle2 className="w-4 h-4" /> : <Clock3 className="w-4 h-4" />}
            {payrollStatus === 'Approved' ? 'Approved' : 'Draft'}
          </span>
        )}
      </div>

      {/* ══════════════════ PERIOD SELECTOR ══════════════════ */}
      <div className="bg-white dark:bg-black/20 p-5 rounded-[24px] shadow-[var(--shadow-apple-soft)] border border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex flex-col md:flex-row items-end gap-4">
          {/* เดือน */}
          <div className="flex-1">
            <label className="block text-sm font-bold text-[var(--apple-text-secondary)] mb-2">
              เดือน
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(Number(e.target.value)); setIsCalculated(false); }}
              className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-[var(--apple-text-primary)] rounded-[12px] outline-none font-medium focus:ring-2 focus:ring-apple-blue transition"
            >
              {MONTH_NAMES_TH.slice(1).map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>

          {/* ปี (พ.ศ.) */}
          <div className="flex-1">
            <label className="block text-sm font-bold text-[var(--apple-text-secondary)] mb-2">
              ปี (พ.ศ.)
            </label>
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(Number(e.target.value)); setIsCalculated(false); }}
              className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-[var(--apple-text-primary)] rounded-[12px] outline-none font-medium focus:ring-2 focus:ring-apple-blue transition"
            >
              {thaiYears.map((y) => (
                <option key={y} value={y}>{y + 543}</option>
              ))}
            </select>
          </div>

          {/* Quick-select buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                setSelectedMonth(d.getMonth() + 1);
                setSelectedYear(d.getFullYear());
                setIsCalculated(false);
              }}
              className="px-4 py-2.5 text-sm font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--apple-text-primary)] rounded-[980px] transition border border-slate-200 dark:border-slate-700"
            >
              เดือนนี้
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 1);
                setSelectedMonth(d.getMonth() + 1);
                setSelectedYear(d.getFullYear());
                setIsCalculated(false);
              }}
              className="px-4 py-2.5 text-sm font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--apple-text-primary)] rounded-[980px] transition border border-slate-200 dark:border-slate-700"
            >
              เดือนที่แล้ว
            </button>
          </div>

          {/* ปุ่มคำนวณ */}
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="px-7 py-2.5 bg-apple-blue hover:opacity-90 disabled:opacity-60 text-white font-bold rounded-[980px] transition shadow-sm flex items-center gap-2 whitespace-nowrap"
          >
            {isCalculating ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> กำลังคำนวณ...</>
            ) : (
              <><Calculator className="w-5 h-5" /> คำนวณอัตโนมัติ</>
            )}
          </button>
        </div>

        {/* Info note */}
        <div className="mt-4 flex items-start gap-2 text-xs text-[var(--apple-text-secondary)] bg-black/5 dark:bg-white/5 rounded-[12px] px-4 py-3">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-apple-blue" />
          <span>
            ระบบจะดึงข้อมูลพนักงานที่ <b>Active</b> ทั้งหมด แล้วคำนวณ OT จาก <code>time_in_3/time_out_3</code> และหักขาดงานตามวันทำงาน (จันทร์–ศุกร์) ที่ไม่มีการสแกนนิ้ว
            &nbsp;— <span className="text-amber-600 dark:text-amber-400">เงินโบนัสสามารถแก้ไขได้ในตาราง</span>
          </span>
        </div>
      </div>

      {/* ══════════════════ SUMMARY CARDS ══════════════════ */}
      {isCalculated && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[
            {
              label: 'รวมพนักงาน',
              value: `${payrollItems.length} คน`,
              icon: <Users className="w-5 h-5" />,
              color: 'text-apple-blue',
              bg: 'bg-blue-50 dark:bg-blue-500/10',
            },
            {
              label: 'รวมเงินเดือนฐาน',
              value: `${fmt(totalBaseSalary)} ฿`,
              icon: <DollarSign className="w-5 h-5" />,
              color: 'text-indigo-600 dark:text-indigo-400',
              bg: 'bg-indigo-50 dark:bg-indigo-500/10',
            },
            {
              label: 'รวมค่า OT',
              value: `${fmt(totalOTPay)} ฿`,
              icon: <TrendingUp className="w-5 h-5" />,
              color: 'text-orange-600 dark:text-orange-400',
              bg: 'bg-orange-50 dark:bg-orange-500/10',
            },
            {
              label: 'รวมโบนัส',
              value: `${fmt(totalBonus)} ฿`,
              icon: <Gift className="w-5 h-5" />,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            },
            {
              label: 'รวมจ่ายสุทธิ',
              value: `${fmt(totalNet)} ฿`,
              icon: <DollarSign className="w-5 h-5" />,
              color: 'text-emerald-700 dark:text-emerald-300',
              bg: 'bg-emerald-50 dark:bg-emerald-500/10',
              large: true,
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`bg-white dark:bg-black/20 rounded-[20px] shadow-[var(--shadow-apple-soft)] border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-2 ${card.large ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <div className={`w-9 h-9 rounded-[10px] ${card.bg} flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
              <p className="text-xs font-bold text-[var(--apple-text-secondary)]">{card.label}</p>
              <p className={`text-lg font-extrabold ${card.color} leading-tight`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════ ACTION BUTTONS ══════════════════ */}
      {isCalculated && (
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[980px] transition shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Export Excel
          </button>

          {payrollStatus === 'Draft' && (
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 px-5 py-2.5 bg-apple-blue hover:opacity-90 text-white font-bold rounded-[980px] transition shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              อนุมัติเงินเดือน
            </button>
          )}

          <span className="ml-auto text-sm text-[var(--apple-text-secondary)] font-medium">
            {MONTH_NAMES_TH[selectedMonth]} {selectedYear + 543} — {payrollItems.length} รายการ
          </span>
        </div>
      )}

      {/* ══════════════════ PAYROLL TABLE ══════════════════ */}
      {isCalculated ? (
        <div className="bg-white dark:bg-black/20 rounded-[24px] shadow-[var(--shadow-apple-soft)] border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-black/5 dark:bg-white/5 sticky top-0 z-10">
                <tr>
                  {/* identity */}
                  <th className="px-4 py-3 text-left text-xs font-bold text-[var(--apple-text-secondary)] whitespace-nowrap">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[var(--apple-text-secondary)] whitespace-nowrap">รหัส</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[var(--apple-text-secondary)] whitespace-nowrap">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[var(--apple-text-secondary)] whitespace-nowrap">แผนก</th>
                  {/* salary */}
                  <th className="px-4 py-3 text-right text-xs font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap border-l border-slate-200 dark:border-slate-700">
                    เงินเดือนฐาน
                  </th>
                  {/* OT */}
                  <th className="px-4 py-3 text-right text-xs font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap border-l border-slate-200 dark:border-slate-700">
                    OT (ชม.)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                    เงิน OT
                  </th>
                  {/* absent */}
                  <th className="px-4 py-3 text-right text-xs font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap border-l border-slate-200 dark:border-slate-700">
                    ขาด (วัน)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    หักขาด
                  </th>
                  {/* bonus */}
                  <th className="px-4 py-3 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap border-l border-slate-200 dark:border-slate-700">
                    โบนัส
                  </th>
                  {/* net */}
                  <th className="px-5 py-3 text-right text-xs font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap border-l border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-500/5">
                    เงินสุทธิ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {payrollItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-16 text-center text-[var(--apple-text-secondary)] font-medium">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  payrollItems.map((item, idx) => (
                    <tr key={item.employee_id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                      {/* identity */}
                      <td className="px-4 py-3 text-[var(--apple-text-secondary)] font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-[var(--apple-text-primary)]">{item.emp_code}</td>
                      <td className="px-4 py-3 font-medium text-[var(--apple-text-primary)] whitespace-nowrap">{item.full_name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2.5 py-1 rounded-[980px] text-xs font-bold bg-black/5 dark:bg-white/5 text-[var(--apple-text-primary)] border border-slate-200 dark:border-slate-700">
                          {item.department}
                        </span>
                      </td>
                      {/* salary */}
                      <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400 border-l border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        {fmt(item.base_salary)}
                      </td>
                      {/* OT */}
                      <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400 font-semibold border-l border-slate-100 dark:border-slate-800">
                        {item.ot_hours > 0 ? item.ot_hours.toFixed(2) : <span className="text-[var(--apple-text-secondary)]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400 font-bold whitespace-nowrap">
                        {item.ot_pay > 0 ? fmt(item.ot_pay) : <span className="text-[var(--apple-text-secondary)]">—</span>}
                      </td>
                      {/* absent */}
                      <td className="px-4 py-3 text-right font-semibold border-l border-slate-100 dark:border-slate-800">
                        {item.absent_days > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">{item.absent_days}</span>
                        ) : (
                          <span className="text-[var(--apple-text-secondary)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {item.absent_deduct > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">−{fmt(item.absent_deduct)}</span>
                        ) : (
                          <span className="text-[var(--apple-text-secondary)]">—</span>
                        )}
                      </td>
                      {/* bonus — editable input */}
                      <td className="px-3 py-2 border-l border-slate-100 dark:border-slate-800">
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={item.bonus || ''}
                          onChange={(e) => handleBonusChange(item.employee_id, e.target.value)}
                          placeholder="0"
                          disabled={payrollStatus === 'Approved'}
                          className="w-24 px-2 py-1 text-right text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-[8px] outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        />
                      </td>
                      {/* net */}
                      <td className="px-5 py-3 text-right border-l border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-500/5 whitespace-nowrap">
                        <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                          {fmt(item.net_pay)} ฿
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* ── Footer totals ── */}
              {payrollItems.length > 0 && (
                <tfoot className="bg-black/5 dark:bg-white/5 border-t-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-extrabold text-[var(--apple-text-primary)]">
                      รวมทั้งหมด ({payrollItems.length} คน)
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-extrabold text-indigo-600 dark:text-indigo-400 border-l border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {fmt(totalBaseSalary)}
                    </td>
                    <td className="px-4 py-3 text-right border-l border-slate-200 dark:border-slate-700 text-[var(--apple-text-secondary)]">
                      {payrollItems.reduce((s, i) => s + i.ot_hours, 0).toFixed(2)} ชม.
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-extrabold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                      {fmt(totalOTPay)}
                    </td>
                    <td className="px-4 py-3 text-right border-l border-slate-200 dark:border-slate-700 text-[var(--apple-text-secondary)]">
                      {payrollItems.reduce((s, i) => s + i.absent_days, 0)} วัน
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      −{fmt(totalDeduct)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-extrabold text-emerald-600 dark:text-emerald-400 border-l border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {fmt(totalBonus)}
                    </td>
                    <td className="px-5 py-3 text-right border-l border-slate-200 dark:border-slate-700 bg-emerald-50/30 dark:bg-emerald-500/5 whitespace-nowrap">
                      <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                        {fmt(totalNet)} ฿
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : (
        /* ── Empty / Not-yet-calculated state ── */
        <div className="bg-white dark:bg-black/20 rounded-[24px] shadow-[var(--shadow-apple-soft)] border border-slate-200 dark:border-slate-800 p-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-apple-blue/10 flex items-center justify-center mb-4">
            <Calculator className="w-8 h-8 text-apple-blue" />
          </div>
          <h3 className="text-xl font-extrabold text-[var(--apple-text-primary)] mb-2">
            ยังไม่ได้คำนวณเงินเดือน
          </h3>
          <p className="text-[var(--apple-text-secondary)] font-medium mb-6">
            เลือกเดือน / ปี แล้วกด <b>คำนวณอัตโนมัติ</b> เพื่อเริ่มต้น
          </p>
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="px-8 py-3 bg-apple-blue hover:opacity-90 disabled:opacity-60 text-white font-bold rounded-[980px] transition shadow-sm flex items-center gap-2 mx-auto"
          >
            {isCalculating ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> กำลังคำนวณ...</>
            ) : (
              <><Calculator className="w-5 h-5" /> คำนวณอัตโนมัติ</>
            )}
          </button>
        </div>
      )}

      {/* ══════════════════ DB NOTE ══════════════════ */}
      <div className="mt-6 flex items-start gap-2 text-xs text-[var(--apple-text-secondary)] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-[16px] px-4 py-3">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          <b className="text-amber-700 dark:text-amber-400">หมายเหตุ:</b>{' '}
          ข้อมูลเงินเดือนถูกเก็บใน React State ชั่วคราวเท่านั้น
          หากต้องการบันทึกลงฐานข้อมูล กรุณาติดต่อ Admin เพื่อสร้างตาราง{' '}
          <code className="bg-amber-100 dark:bg-amber-500/20 px-1 rounded">payroll_runs</code> และ{' '}
          <code className="bg-amber-100 dark:bg-amber-500/20 px-1 rounded">payroll_items</code> ใน Supabase
        </span>
      </div>
    </div>
  );
}
