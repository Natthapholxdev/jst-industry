'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, Calendar, Clock, AlertTriangle, Phone, Mail, MapPin, 
  Building2, Wallet, FileText, CheckCircle, ExternalLink, Printer, 
  Edit, UserX, X, Sparkles, ChevronRight, Copy, Check, UserCircle2,
  CalendarDays, TrendingUp, AlertCircle, ShieldCheck, HeartPulse,
  Briefcase, Award, Shirt, ArrowUpRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EmployeeProfileDossierProps {
  employee: any;
  shifts?: any[];
  onClose: () => void;
  onEdit: () => void;
  onSoftDelete?: (emp: any) => void;
}

export default function EmployeeProfileDossier({
  employee,
  shifts = [],
  onClose,
  onEdit,
  onSoftDelete
}: EmployeeProfileDossierProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('personal');
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Real-time fetched data
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(true);

  // คำนวณอายุ
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return '-';
    const birth = new Date(birthDateString);
    if (isNaN(birth.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} ปี` : '-';
  };

  // ดึงข้อมูลกะการทำงาน
  const assignedShift = useMemo(() => {
    if (!employee?.shift_id || !shifts.length) return null;
    return shifts.find(s => s.id === employee.shift_id) || null;
  }, [employee, shifts]);

  // ดึงข้อมูลการลงเวลาทำงาน & การลา
  useEffect(() => {
    if (!employee?.id) return;

    const fetchProfileData = async () => {
      setIsLoadingLogs(true);
      setIsLoadingLeaves(true);

      try {
        // ดึง attendance logs ย้อนหลัง 30 วัน
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

        const { data: logs, error: logsError } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('log_date', startDateStr)
          .order('log_date', { ascending: false });

        if (!logsError && logs) {
          setAttendanceLogs(logs);
        }

        // ดึง leave requests ล่าสุด 10 รายการ
        const { data: leaves, error: leavesError } = await supabase
          .from('leave_requests')
          .select('*')
          .eq('employee_id', employee.id)
          .order('start_date', { ascending: false })
          .limit(10);

        if (!leavesError && leaves) {
          setLeaveRequests(leaves);
        }
      } catch (err) {
        console.error('Error fetching dossier data:', err);
      } finally {
        setIsLoadingLogs(false);
        setIsLoadingLeaves(false);
      }
    };

    fetchProfileData();
  }, [employee?.id]);

  // สรุปสถิติ 30 วันล่าสุด
  const attendanceStats = useMemo(() => {
    let presentDays = 0;
    let lateCount = 0;
    let totalOtHours = 0;
    const shiftTimeIn = assignedShift?.time_in || '08:00';

    const parseTimeToHour = (t: string) => {
      if (!t || t === '-') return 0;
      const clean = t.replace('.', ':');
      const [h, m] = clean.split(':').map(Number);
      return (h || 0) + ((m || 0) / 60);
    };

    attendanceLogs.forEach(log => {
      // วันที่มาทำงาน
      if (log.time_in_1 && log.time_in_1 !== '-') {
        presentDays++;
        // ตรวจสอบมาสาย
        if (parseTimeToHour(log.time_in_1) > parseTimeToHour(shiftTimeIn)) {
          lateCount++;
        }
      }

      // โอที
      if (log.time_in_3 === 'OT' && log.time_out_3) {
        totalOtHours += Number(log.time_out_3) || 0;
      } else if (log.time_in_3 && log.time_out_3 && log.time_in_3 !== '-') {
        const inH = parseTimeToHour(log.time_in_3);
        const outH = parseTimeToHour(log.time_out_3);
        if (outH > inH) totalOtHours += (outH - inH);
      }
    });

    return {
      presentDays,
      lateCount,
      totalOtHours: totalOtHours.toFixed(1),
      totalLogs: attendanceLogs.length
    };
  }, [attendanceLogs, assignedShift]);

  // คัดลอกเบอร์โทร
  const handleCopyPhone = () => {
    if (employee.phone) {
      navigator.clipboard.writeText(employee.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  // เลื่อนไป section ที่เลือก
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 print:p-0 print:bg-white print:static animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden print:max-w-full print:shadow-none print:max-h-none print:overflow-visible print:border-none">
        
        {/* ========================================================
            TOP HERO BAR (Profile Banner & Quick Action Buttons)
           ======================================================== */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 pb-5 shrink-0 overflow-hidden print:bg-none print:text-black print:p-4 print:border-b">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Avatar & Employee Basic Info */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 p-0.5 shadow-xl">
                  <div className="w-full h-full bg-slate-900/80 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                    {employee.gender === 'หญิง' ? (
                      <UserCircle2 className="w-12 h-12 text-pink-300" />
                    ) : (
                      <UserCircle2 className="w-12 h-12 text-indigo-300" />
                    )}
                  </div>
                </div>
                <span className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border-2 border-slate-900 flex items-center gap-1 shadow-md ${
                  employee.status === 'Active' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-rose-500 text-white'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  {employee.status === 'Active' ? 'ทำงานอยู่' : 'พ้นสภาพ'}
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white print:text-black">
                    {employee.full_name}
                  </h1>
                  {employee.nickname && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-sm font-semibold backdrop-blur-sm print:text-slate-600">
                      ({employee.nickname})
                    </span>
                  )}
                </div>

                <p className="text-indigo-200 dark:text-indigo-300 font-medium text-sm sm:text-base mt-1 flex flex-wrap items-center gap-2">
                  <span>{employee.position || 'พนักงาน'}</span>
                  <span className="opacity-40">•</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 font-semibold text-xs border border-indigo-400/30">
                    {employee.departments?.name_th || 'ไม่ระบุแผนก'}
                  </span>
                </p>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-xs font-medium text-slate-300">
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 font-mono">
                    รหัส: <strong className="text-white">{employee.emp_code}</strong>
                  </span>
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                    สแกนนิ้ว: <strong className="text-white">{employee.fingerprint_id || '-'}</strong>
                  </span>
                  {assignedShift && (
                    <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 flex items-center gap-1 text-amber-300">
                      <Clock className="w-3.5 h-3.5 inline" /> {assignedShift.name || 'กะปกติ'} ({assignedShift.time_in} - {assignedShift.time_out})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Header Toolbar */}
            <div className="flex flex-wrap items-center gap-2 print:hidden self-start md:self-center">
              
              {/* ดูบันทึกเวลาเต็ม */}
              <button
                onClick={() => router.push(`/attendance-person?empId=${employee.id}`)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                title="เปิดดูบันทึกเวลาทำงานและแก้ไขเวลา"
              >
                <Clock className="w-4 h-4" />
                <span>บันทึกเวลา</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              </button>

              {/* พิมพ์แฟ้มประวัติ A4 */}
              <button 
                onClick={() => window.print()}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-bold backdrop-blur-sm border border-white/10 transition flex items-center gap-1.5"
                title="พิมพ์ประวัติออกทางเครื่องพิมพ์"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">พิมพ์ประวัติ</span>
              </button>

              {/* ปุ่มแก้ไข */}
              <button 
                onClick={onEdit}
                className="px-3.5 py-2 bg-amber-500/90 hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-1.5"
                title="แก้ไขข้อมูลพนักงานคนนี้"
              >
                <Edit className="w-4 h-4" />
                <span>แก้ไข</span>
              </button>

              {/* พ้นสภาพ / ลาออก */}
              {employee.status === 'Active' && onSoftDelete && (
                <button 
                  onClick={() => onSoftDelete(employee)}
                  className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white rounded-xl text-xs sm:text-sm font-bold border border-rose-500/30 transition flex items-center gap-1.5"
                  title="แจ้งพ้นสภาพ/ลาออก"
                >
                  <UserX className="w-4 h-4" />
                  <span className="hidden sm:inline">พ้นสภาพ</span>
                </button>
              )}

              {/* ปุ่มปิด */}
              <button 
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition ml-1"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================
            STICKY SECTION NAVIGATOR (Jump Pills)
           ======================================================== */}
        <div className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto hide-scrollbar print:hidden">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> นำทางด่วน:
          </span>
          {[
            { id: 'section-personal', label: '👤 ข้อมูลส่วนตัว & ที่อยู่' },
            { id: 'section-work', label: '💼 การจ้างงาน & ค่าตอบแทน' },
            { id: 'section-attendance', label: `⏱️ สถิติเวลาทำงาน & OT (${attendanceStats.presentDays} วัน)` },
            { id: 'section-leaves', label: `🌴 ประวัติการลา (${leaveRequests.length} รายการ)` },
            { id: 'section-emergency', label: '🚨 ฉุกเฉิน & เอกสารแนบ' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeSection === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ========================================================
            SCROLLABLE CONTENT (One Single Smooth Page)
           ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/40 print:p-0 print:space-y-6">

          {/* SECTION 1: ข้อมูลส่วนตัว & การติดต่อ */}
          <section id="section-personal" className="scroll-mt-16">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">ข้อมูลส่วนตัว & ข้อมูลการติดต่อ</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">ประวัติพื้นฐาน เลขประจำตัว และช่องทางการสื่อสาร</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* ข้อมูลระบุตัวตน */}
              <div className="md:col-span-2 bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  บัตรประชาชน & ประวัติส่วนบุคคล
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">เลขบัตรประชาชน</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-base">
                      {employee.national_id || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">วัน/เดือน/ปีเกิด</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {employee.birth_date || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">อายุ</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {calculateAge(employee.birth_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">เพศ</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {employee.gender || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">กรุ๊ปเลือด</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {employee.blood_type || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">สถานภาพ</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {employee.marital_status || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">ศาสนา</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {employee.religion || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">วุฒิการศึกษา</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {employee.education || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">ขนาดเสื้อ</span>
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-xs">
                      <Shirt className="w-3.5 h-3.5 text-indigo-500" /> {employee.shirt_size || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* การติดต่อด่วน */}
              <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    ช่องทางติดต่อ
                  </div>
                  
                  {/* Phone */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block">เบอร์โทรศัพท์</span>
                        <a 
                          href={employee.phone ? `tel:${employee.phone}` : undefined}
                          className="font-bold text-slate-800 dark:text-white hover:underline text-sm"
                        >
                          {employee.phone || '-'}
                        </a>
                      </div>
                    </div>
                    {employee.phone && (
                      <button 
                        onClick={handleCopyPhone}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        title="คัดลอกเบอร์"
                      >
                        {copiedPhone ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block">อีเมล</span>
                      <span className="font-bold text-slate-800 dark:text-white truncate block text-sm">
                        {employee.email || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address preview */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> ที่อยู่ปัจจุบัน
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {employee.address_line1 ? (
                      <>
                        {employee.address_line1} {employee.address_street && `ถนน${employee.address_street}`}{' '}
                        {employee.address_subdistrict && `ต.${employee.address_subdistrict}`}{' '}
                        {employee.address_district && `อ.${employee.address_district}`}{' '}
                        {employee.address_province && `จ.${employee.address_province}`} {employee.address_zip}
                      </>
                    ) : (
                      employee.address || '-'
                    )}
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* SECTION 2: การจ้างงาน & บัญชีเงินเดือน */}
          <section id="section-work" className="scroll-mt-16">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">การจ้างงาน & อัตราค่าตอบแทน</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">ข้อมูลตำแหน่งงาน รอบกะ และบัญชีสำหรับจ่ายค่าจ้าง</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* แผนก & ตำแหน่ง */}
              <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">สังกัดงาน</span>
                <div className="text-lg font-black text-slate-800 dark:text-white">
                  {employee.departments?.name_th || 'ไม่ระบุแผนก'}
                </div>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  ตำแหน่ง: {employee.position || 'พนักงาน'}
                </div>
                <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  รหัสสแกนนิ้ว: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{employee.fingerprint_id || '-'}</span>
                </div>
              </div>

              {/* กะการทำงาน */}
              <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">กะการทำงาน (Shift)</span>
                <div className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  {assignedShift?.name || 'กะปกติ'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  เวลาเข้า-ออก: <strong className="text-slate-900 dark:text-white">{assignedShift?.time_in || '08:00'} - {assignedShift?.time_out || '17:00'}</strong>
                </div>
                <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  เริ่มคิด OT: {assignedShift?.ot_start_time || '17:30'} น.
                </div>
              </div>

              {/* ค่าแรง & อัตรา OT */}
              <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">อัตราค่าจ้าง</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {employee.hourly_rate ? Number(employee.hourly_rate).toLocaleString() : '0'}
                  </span>
                  <span className="text-xs text-slate-400">฿/วัน</span>
                </div>
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>เรทค่า OT:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {employee.ot_hourly_rate ? Number(employee.ot_hourly_rate).toLocaleString() : '0'} ฿/ชม.
                  </span>
                </div>
                <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  เงินเดือนฐาน: {employee.base_salary ? `${Number(employee.base_salary).toLocaleString()} ฿` : '-'}
                </div>
              </div>

              {/* บัญชีธนาคาร */}
              <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">บัญชีรับเงินโอน</span>
                <div className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-purple-500" />
                  {employee.bank_name || 'ไม่ระบุธนาคาร'}
                </div>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60">
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 block font-bold">เลขที่บัญชี</span>
                  <span className="text-sm font-mono font-black tracking-wider text-purple-900 dark:text-purple-200">
                    {employee.bank_account_no || '-'}
                  </span>
                </div>
              </div>

            </div>
          </section>

          {/* SECTION 3: สถิติเวลาทำงาน & ไทม์ชีทล่าสุด */}
          <section id="section-attendance" className="scroll-mt-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">สถิติเวลาทำงาน & ไทม์ชีทล่าสุด (30 วัน)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">สรุปการลงเวลาเข้า-ออกงาน การมาสาย และชั่วโมงทำงานล่วงเวลา</p>
                </div>
              </div>

              <button
                onClick={() => router.push(`/attendance-person?empId=${employee.id}`)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 self-start sm:self-auto print:hidden"
              >
                <span>เปิดไทม์ชีทรายคนฉบับเต็ม</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* KPI 4 Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              
              <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">มาทำงาน</span>
                  <span className="text-xl font-black text-slate-800 dark:text-white">
                    {attendanceStats.presentDays} <span className="text-xs font-normal text-slate-400">วัน</span>
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">มาสาย</span>
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                    {attendanceStats.lateCount} <span className="text-xs font-normal text-slate-400">ครั้ง</span>
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">โอทีสะสม</span>
                  <span className="text-xl font-black text-orange-600 dark:text-orange-400">
                    {attendanceStats.totalOtHours} <span className="text-xs font-normal text-slate-400">ชม.</span>
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">ประวัติที่บันทึก</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                    {attendanceStats.totalLogs} <span className="text-xs font-normal text-slate-400">วัน</span>
                  </span>
                </div>
              </div>

            </div>

            {/* Attendance Mini-Table */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  บันทึกการสแกนนิ้วล่าสุด (10 รายการ)
                </span>
                <span className="text-[11px] text-slate-400">
                  เรียงตามวันที่ล่าสุด
                </span>
              </div>

              {isLoadingLogs ? (
                <div className="p-8 text-center text-xs text-slate-400">กำลังโหลดข้อมูลเวลา...</div>
              ) : attendanceLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">ยังไม่มีบันทึกเวลาทำงานในช่วงนี้</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/60 dark:bg-slate-900/30 text-slate-500 font-semibold border-b border-slate-200/60 dark:border-slate-700/60">
                      <tr>
                        <th className="px-4 py-2.5">วันที่</th>
                        <th className="px-4 py-2.5 text-center">เข้างาน (1)</th>
                        <th className="px-4 py-2.5 text-center">ออกงาน (1)</th>
                        <th className="px-4 py-2.5 text-center">เข้า (2)</th>
                        <th className="px-4 py-2.5 text-center">ออก (2)</th>
                        <th className="px-4 py-2.5 text-center">OT (เข้า-ออก)</th>
                        <th className="px-4 py-2.5">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 font-medium">
                      {attendanceLogs.slice(0, 10).map((log) => {
                        const isLate = log.time_in_1 && assignedShift?.time_in && log.time_in_1 > assignedShift.time_in;
                        return (
                          <tr key={log.id || log.log_date} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                            <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              {log.log_date}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {log.time_in_1 ? (
                                <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                                  isLate 
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' 
                                    : 'text-indigo-600 dark:text-indigo-400'
                                }`}>
                                  {log.time_in_1}
                                </span>
                              ) : <span className="text-slate-300">-</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono text-slate-600 dark:text-slate-300">
                              {log.time_out_1 || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono text-slate-500">
                              {log.time_in_2 || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono text-slate-500">
                              {log.time_out_2 || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono text-orange-600 dark:text-orange-400 font-bold">
                              {log.time_in_3 === 'OT' ? `${log.time_out_3} ชม.` : (log.time_in_3 ? `${log.time_in_3} - ${log.time_out_3 || ''}` : '-')}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">
                              {log.remark || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 4: ประวัติการลางาน */}
          <section id="section-leaves" className="scroll-mt-16">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">ประวัติการลางาน & วันลาคงเหลือ</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">รายการยื่นขอลาป่วย ลากิจ และพักร้อนของพนักงาน</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
              {isLoadingLeaves ? (
                <div className="p-8 text-center text-xs text-slate-400">กำลังโหลดประวัติการลา...</div>
              ) : leaveRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">ไม่มีประวัติการยื่นลางานในระบบ</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/60 dark:bg-slate-900/30 text-slate-500 font-semibold border-b border-slate-200/60 dark:border-slate-700/60">
                      <tr>
                        <th className="px-4 py-2.5">ประเภทการลา</th>
                        <th className="px-4 py-2.5">ตั้งแต่วันที่</th>
                        <th className="px-4 py-2.5">ถึงวันที่</th>
                        <th className="px-4 py-2.5">เหตุผล</th>
                        <th className="px-4 py-2.5 text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 font-medium">
                      {leaveRequests.map((leave) => {
                        let statusColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400';
                        let statusText = 'รออนุมัติ';
                        if (leave.status === 'Approved' || leave.status === 'อนุมัติ') {
                          statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400';
                          statusText = 'อนุมัติแล้ว';
                        } else if (leave.status === 'Rejected' || leave.status === 'ปฏิเสธ') {
                          statusColor = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400';
                          statusText = 'ไม่อนุมัติ';
                        }

                        return (
                          <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                            <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-white">
                              {leave.leave_type}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {leave.start_date}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {leave.end_date}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">
                              {leave.reason || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 5: ติดต่อฉุกเฉิน & เอกสารแนบ */}
          <section id="section-emergency" className="scroll-mt-16 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">ผู้ติดต่อกรณีฉุกเฉิน & แฟ้มเอกสารแนบ</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">บุคคลที่ติดต่อได้ทันทีเมื่อเกิดเหตุฉุกเฉิน และเอกสารหลักฐานสำคัญ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Emergency Contact */}
              <div className="bg-rose-50/60 dark:bg-rose-950/20 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" /> ข้อมูลติดต่อฉุกเฉิน
                  </span>
                  {employee.emergency_contact_relation && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-bold">
                      ความสัมพันธ์: {employee.emergency_contact_relation}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">ชื่อผู้ติดต่อ:</span>
                    <span className="font-bold text-slate-800 dark:text-white text-base">
                      {employee.emergency_contact_name || 'ไม่ระบุ'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
                    <span className="text-slate-500 dark:text-slate-400">เบอร์โทรศัพท์ฉุกเฉิน:</span>
                    <a 
                      href={employee.emergency_contact_phone ? `tel:${employee.emergency_contact_phone}` : undefined}
                      className="font-bold font-mono text-rose-700 dark:text-rose-400 hover:underline text-base flex items-center gap-1"
                    >
                      <Phone className="w-4 h-4" />
                      {employee.emergency_contact_phone || '-'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Attachments / Files */}
              <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-2">
                    แฟ้มเอกสารแนบ (HR Documents)
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    ไฟล์ประวัติ สำเนาบัตรประชาชน หรือเอกสารสัญญาที่แนบไว้ในระบบ Supabase Storage
                  </p>

                  {employee.document_url ? (
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-slate-800 dark:text-white block truncate">
                            เอกสารแนบประจำตัวพนักงาน
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block font-mono">
                            {employee.document_url.split('/').pop() || 'document.pdf'}
                          </span>
                        </div>
                      </div>
                      <a
                        href={employee.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-sm"
                      >
                        <span>เปิดดูไฟล์</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400 font-medium">
                      ไม่มีเอกสารแนบสำหรับพนักงานคนนี้
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 text-right pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}
                </div>
              </div>

            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
