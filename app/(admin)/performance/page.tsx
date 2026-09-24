'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3, ChevronDown, Download, Save, Info, RefreshCw,
  Users, Award, TrendingUp, Star, Loader2, CheckCircle2,
  ClipboardList, Calendar, Target, Smile, BookOpen, Clock,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/routes';
import * as xlsx from 'xlsx';
import { saveAs } from 'file-saver';

// ── Types ─────────────────────────────────────────────────────────────────
interface Employee {
  id: string;
  emp_code: string;
  full_name: string;
  department: string;
}

interface KPICriteria {
  id: string;
  name: string;
  weight: number;
}

interface ScoreRecord {
  [kpiId: string]: number;
}

interface EmployeeScore {
  employee_id: string;
  scores: ScoreRecord;
  attendance_percent?: number;
}

interface GradeDef {
  grade: string;
  min: number;
  max: number;
  color: string;
  textColor: string;
}

// ── Constants ─────────────────────────────────────────────────────────────
const GRADES: GradeDef[] = [
  { grade: 'A', min: 90, max: 100, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  { grade: 'B+', min: 80, max: 89.99, color: 'bg-blue-500', textColor: 'text-blue-700' },
  { grade: 'B', min: 70, max: 79.99, color: 'bg-indigo-500', textColor: 'text-indigo-700' },
  { grade: 'C', min: 60, max: 69.99, color: 'bg-amber-500', textColor: 'text-amber-700' },
  { grade: 'D', min: 0, max: 59.99, color: 'bg-rose-500', textColor: 'text-rose-700' },
];

const DEFAULT_CRITERIA: KPICriteria[] = [
  { id: 'c1', name: 'ผลงานตามเป้าหมาย (KPI)', weight: 40 },
  { id: 'c2', name: 'คุณภาพของงานที่ได้รับมอบหมาย', weight: 20 },
  { id: 'c3', name: 'ความตรงต่อเวลา / การขาดลา', weight: 15 },
  { id: 'c4', name: 'ทัศนคติ / ความร่วมมือกับทีม', weight: 15 },
  { id: 'c5', name: 'การพัฒนาตนเอง / เรียนรู้สิ่งใหม่', weight: 10 },
];

export default function PerformanceKPIPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [criteria, setCriteria] = useState<KPICriteria[]>(DEFAULT_CRITERIA);
  const [employeeScores, setEmployeeScores] = useState<Record<string, EmployeeScore>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  const [selectedQuarter, setSelectedQuarter] = useState<number>(() => Math.floor(new Date().getMonth() / 3) + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // ── Fetch Initial Data ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('employees')
          .select('id, emp_code, full_name, department')
          .eq('status', 'Active')
          .order('emp_code');

        if (error) throw error;

        setEmployees(data || []);
        
        // Initialize scores
        const initScores: Record<string, EmployeeScore> = {};
        (data || []).forEach(emp => {
          initScores[emp.id] = {
            employee_id: emp.id,
            scores: {},
          };
        });
        setEmployeeScores(initScores);
      } catch (err) {
        console.error("Error fetching employees:", err);
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลพนักงานได้', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // ── Calculate Score & Grade ─────────────────────────────────────────────
  const calculateTotalScore = useCallback((empId: string) => {
    const scoreRecord = employeeScores[empId]?.scores;
    if (!scoreRecord) return 0;

    let total = 0;
    criteria.forEach(c => {
      const rawScore = scoreRecord[c.id] || 0; // 1-5
      const weightedScore = (rawScore / 5) * c.weight;
      total += weightedScore;
    });
    return Number(total.toFixed(2));
  }, [employeeScores, criteria]);

  const getGrade = (score: number): GradeDef => {
    if (score === 0) return { grade: '-', min: 0, max: 0, color: 'bg-slate-300', textColor: 'text-slate-500' };
    return GRADES.find(g => score >= g.min) || GRADES[GRADES.length - 1];
  };

  // ── Weight Validation ───────────────────────────────────────────────────
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isWeightValid = totalWeight === 100;

  const handleWeightChange = (id: string, newWeight: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, weight: newWeight } : c));
  };

  const handleScoreChange = (empId: string, kpiId: string, value: string) => {
    let numValue = parseInt(value);
    if (isNaN(numValue)) numValue = 0;
    if (numValue > 5) numValue = 5;
    if (numValue < 0) numValue = 0;

    setEmployeeScores(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        scores: {
          ...prev[empId]?.scores,
          [kpiId]: numValue
        }
      }
    }));
  };

  // ── Auto-Link Attendance ────────────────────────────────────────────────
  const fetchAttendanceForQuarter = async () => {
    setIsFetchingAttendance(true);
    try {
      // Calculate start and end date for the selected quarter
      const startMonth = (selectedQuarter - 1) * 3;
      const startDate = new Date(selectedYear, startMonth, 1);
      const endDate = new Date(selectedYear, startMonth + 3, 0);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Calculate total working days (Mon-Fri) in this quarter
      let workingDays = 0;
      let d = new Date(startDate);
      while (d <= endDate) {
        if (d.getDay() !== 0 && d.getDay() !== 6) workingDays++;
        d.setDate(d.getDate() + 1);
      }

      if (workingDays === 0) throw new Error("No working days in period");

      // Fetch attendance
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('employee_id, log_date')
        .gte('log_date', startDateStr)
        .lte('log_date', endDateStr)
        .not('time_in_1', 'is', null);

      if (error) throw error;

      // Group by employee
      const attendanceCount: Record<string, number> = {};
      (data || []).forEach(log => {
        attendanceCount[log.employee_id] = (attendanceCount[log.employee_id] || 0) + 1;
      });

      // Update scores
      setEmployeeScores(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(empId => {
          const attended = attendanceCount[empId] || 0;
          let percent = (attended / workingDays) * 100;
          if (percent > 100) percent = 100;

          // Convert % to 1-5 score
          let score = 1;
          if (percent >= 97) score = 5;
          else if (percent >= 93) score = 4;
          else if (percent >= 88) score = 3;
          else if (percent >= 80) score = 2;

          next[empId] = {
            ...next[empId],
            attendance_percent: Number(percent.toFixed(1)),
            scores: {
              ...next[empId].scores,
              'c3': score // c3 is hardcoded as Attendance in DEFAULT_CRITERIA
            }
          };
        });
        return next;
      });

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'ดึงข้อมูลการมาทำงานเรียบร้อย',
        showConfirmButton: false,
        timer: 3000
      });
    } catch (err) {
      console.error(err);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลเวลาเข้าออกได้', 'error');
    } finally {
      setIsFetchingAttendance(false);
    }
  };

  // ── Save Data ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isWeightValid) {
      Swal.fire('น้ำหนักไม่ถูกต้อง', 'กรุณาปรับน้ำหนักรวมให้ครบ 100%', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const periodStr = `${selectedYear}-Q${selectedQuarter}`;
      
      const payload = employees.map(emp => {
        const total = calculateTotalScore(emp.id);
        const grade = getGrade(total).grade;
        return {
          employee_id: emp.id,
          period: periodStr,
          template_id: 1, // Mock
          scores: employeeScores[emp.id]?.scores || {},
          total_score: total,
          grade: grade,
          status: 'draft'
        };
      });

      const { error } = await supabase
        .from('performance_reviews')
        .upsert(payload, { onConflict: 'employee_id,period' });

      if (error) {
        if (error.code === '42P01') {
           Swal.fire({
            icon: 'info',
            title: 'บันทึกลง Local state',
            text: 'ยังไม่มีตาราง performance_reviews ในฐานข้อมูล บันทึกข้อมูลชั่วคราวสำเร็จ',
          });
        } else {
          throw error;
        }
      } else {
        Swal.fire('สำเร็จ', 'บันทึกผลประเมินเรียบร้อย', 'success');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Export Excel ────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const rows = employees.map(emp => {
      const scoreObj = employeeScores[emp.id]?.scores || {};
      const total = calculateTotalScore(emp.id);
      const grade = getGrade(total).grade;
      const attPercent = employeeScores[emp.id]?.attendance_percent;

      const row: any = {
        'รหัสพนักงาน': emp.emp_code,
        'ชื่อ-สกุล': emp.full_name,
        'แผนก': emp.department,
      };

      criteria.forEach((c, i) => {
        row[`${i+1}. ${c.name} (${c.weight}%)`] = scoreObj[c.id] || 0;
      });

      row['% การมาทำงาน (ระบบ)'] = attPercent ? `${attPercent}%` : '-';
      row['คะแนนรวม (100)'] = total;
      row['เกรด'] = grade;

      return row;
    });

    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, `KPI_Q${selectedQuarter}_${selectedYear}`);
    
    const buf = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `KPI_Evaluation_Q${selectedQuarter}_${selectedYear}.xlsx`);
  };

  // ── Stats Calculation ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const counts = { A: 0, 'B+': 0, B: 0, C: 0, D: 0, None: 0 };
    employees.forEach(emp => {
      const total = calculateTotalScore(emp.id);
      if (total === 0) {
        counts.None++;
      } else {
        const grade = getGrade(total).grade;
        if (grade in counts) counts[grade as keyof typeof counts]++;
      }
    });
    return counts;
  }, [employees, employeeScores, calculateTotalScore]);


  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 font-sans">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--apple-text-primary)] flex items-center gap-3">
            <Link href={ROUTES.DASHBOARD} className="text-slate-400 hover:text-indigo-600 dark:text-indigo-400 transition">&larr;</Link>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <TrendingUp className="w-7 h-7" />
            </div>
            ประเมินผลงาน KPI
          </h1>
          <p className="text-[var(--apple-text-secondary)] ml-16 mt-1 font-medium">ระบบประเมินผลพนักงานรายไตรมาส (Top-down)</p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
            {[1, 2, 3, 4].map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  selectedQuarter === q 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Q{q}
              </button>
            ))}
          </div>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - 2 + i;
              return <option key={y} value={y}>{y + 543}</option>
            })}
          </select>
        </div>
      </div>

      <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
          <strong>ระบบประเมินผล KPI แบบ Top-down:</strong> หัวหน้างานประเมินลูกน้อง โดยกรอกคะแนน 1-5 ในแต่ละหัวข้อ ระบบจะนำไปคูณน้ำหนัก (%) และคำนวณเกรดรวมให้อัตโนมัติ<br/>
          <em>*คะแนนข้อ "ความตรงต่อเวลา" สามารถดึงจากเปอร์เซ็นต์การเข้างานในระบบ Attendance ได้โดยตรง</em>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 col-span-2 md:col-span-1">
          <div className="text-xs text-[var(--apple-text-secondary)] font-medium mb-1">พนักงานที่ประเมินแล้ว</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {employees.length - stats.None} <span className="text-sm font-medium text-slate-400">/ {employees.length}</span>
          </div>
        </div>
        {[
          { label: 'เกรด A', count: stats.A, color: 'text-emerald-500' },
          { label: 'เกรด B+', count: stats['B+'], color: 'text-blue-500' },
          { label: 'เกรด B', count: stats.B, color: 'text-indigo-500' },
          { label: 'เกรด C', count: stats.C, color: 'text-amber-500' },
          { label: 'เกรด D', count: stats.D, color: 'text-rose-500' },
        ].map(g => (
          <div key={g.label} className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 text-center flex flex-col justify-center items-center">
            <div className={`text-2xl font-black ${g.color}`}>{g.count}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">{g.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Settings */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <h2 className="font-extrabold text-[var(--apple-text-primary)] mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              เกณฑ์การประเมิน
            </h2>
            
            <div className="space-y-4 mb-4">
              {criteria.map((c, i) => (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <label className="text-sm font-medium text-[var(--apple-text-secondary)] leading-tight flex-1">
                      {i+1}. {c.name}
                    </label>
                    <div className="flex items-center gap-1 shrink-0">
                      <input 
                        type="number" 
                        value={c.weight}
                        onChange={(e) => handleWeightChange(c.id, Number(e.target.value))}
                        className="w-14 text-center px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  {c.id === 'c3' && (
                    <span className="inline-block px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded text-[10px] font-bold">
                      ⚡ ดึงจากระบบ Attendance ได้
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className={`pt-4 border-t ${isWeightValid ? 'border-slate-100 dark:border-slate-700' : 'border-rose-200 dark:border-rose-800/50'} flex justify-between items-center`}>
              <span className="text-sm font-bold text-[var(--apple-text-primary)]">น้ำหนักรวม:</span>
              <span className={`text-lg font-black ${isWeightValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalWeight}%
              </span>
            </div>
            {!isWeightValid && (
              <p className="text-xs text-rose-500 mt-2 font-medium">น้ำหนักรวมต้องเท่ากับ 100% พอดี</p>
            )}

            <button 
              onClick={fetchAttendanceForQuarter}
              disabled={isFetchingAttendance}
              className="mt-6 w-full py-2.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/20 dark:hover:bg-sky-900/40 text-sky-600 dark:text-sky-400 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 border border-sky-200 dark:border-sky-800"
            >
              {isFetchingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              อัปเดตคะแนนการมาทำงาน
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-700 p-5">
             <h2 className="font-extrabold text-[var(--apple-text-primary)] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              เกณฑ์การให้เกรด
            </h2>
            <div className="space-y-2 text-sm">
              {GRADES.map(g => (
                <div key={g.grade} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 font-bold">
                    <span className={`w-3 h-3 rounded-full ${g.color}`} />
                    {g.grade}
                  </div>
                  <div className="text-[var(--apple-text-secondary)] font-medium">
                    {g.min} - {g.max === 100 ? '100' : g.max.toFixed(0)} คะแนน
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Table */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
            <h2 className="font-extrabold text-[var(--apple-text-primary)] flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              ตารางกรอกคะแนน
            </h2>
            <div className="flex gap-2">
               <button 
                onClick={handleExportExcel}
                className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Excel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                บันทึกผล
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-[var(--apple-text-secondary)] sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold sticky left-0 bg-slate-100 dark:bg-slate-900 z-20 shadow-[1px_0_0_var(--tw-shadow-color)] shadow-slate-200 dark:shadow-slate-700">พนักงาน</th>
                  {criteria.map((c, i) => (
                    <th key={c.id} className="p-4 font-bold text-center border-l border-slate-200/50 dark:border-slate-700/50 min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs truncate w-28" title={c.name}>ข้อ {i+1}</span>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">น้ำหนัก {c.weight}%</span>
                      </div>
                    </th>
                  ))}
                  <th className="p-4 font-bold text-center border-l border-slate-200/50 dark:border-slate-700/50">รวมคะแนน</th>
                  <th className="p-4 font-bold text-center">เกรด</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={criteria.length + 3} className="p-12 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan={criteria.length + 3} className="p-12 text-center text-slate-400">ไม่พบพนักงาน</td></tr>
                ) : (
                  employees.map((emp) => {
                    const totalScore = calculateTotalScore(emp.id);
                    const gradeDef = getGrade(totalScore);
                    const scoreObj = employeeScores[emp.id]?.scores || {};
                    const attPercent = employeeScores[emp.id]?.attendance_percent;

                    return (
                      <tr key={emp.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        {/* Employee Column - Sticky */}
                        <td className="p-3 sticky left-0 bg-white dark:bg-slate-800 z-10 shadow-[1px_0_0_var(--tw-shadow-color)] shadow-slate-100 dark:shadow-slate-800/50 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80">
                          <div className="font-bold text-[var(--apple-text-primary)]">{emp.full_name}</div>
                          <div className="text-xs text-[var(--apple-text-secondary)] mt-0.5">{emp.emp_code} • {emp.department}</div>
                        </td>
                        
                        {/* Score Inputs */}
                        {criteria.map((c) => {
                          const val = scoreObj[c.id] || '';
                          
                          // Special UI for Attendance (c3)
                          if (c.id === 'c3' && attPercent !== undefined) {
                            return (
                              <td key={c.id} className="p-3 border-l border-slate-100 dark:border-slate-800/50 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="text-lg font-black text-sky-600 dark:text-sky-400">{val || 0}</div>
                                  <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-500" style={{ width: `${attPercent}%` }} />
                                  </div>
                                  <div className="text-[9px] font-bold text-slate-400">{attPercent}%</div>
                                </div>
                              </td>
                            )
                          }

                          // Normal Inputs
                          return (
                            <td key={c.id} className="p-3 border-l border-slate-100 dark:border-slate-800/50 text-center">
                              <input
                                type="number"
                                min="0" max="5"
                                value={val}
                                onChange={(e) => handleScoreChange(emp.id, c.id, e.target.value)}
                                className="w-16 text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                placeholder="1-5"
                              />
                            </td>
                          );
                        })}

                        {/* Total Score */}
                        <td className="p-3 border-l border-slate-200/50 dark:border-slate-700/50 text-center bg-slate-50/50 dark:bg-slate-900/20">
                          <div className="text-lg font-black text-[var(--apple-text-primary)]">{totalScore}</div>
                          <div className="text-[10px] text-slate-400 font-bold">/ 100</div>
                        </td>

                        {/* Grade */}
                        <td className="p-3 text-center bg-slate-50/50 dark:bg-slate-900/20">
                           <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 ${gradeDef.textColor}`}>
                            <span className={`w-2 h-2 rounded-full ${gradeDef.color}`} />
                            {gradeDef.grade}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
