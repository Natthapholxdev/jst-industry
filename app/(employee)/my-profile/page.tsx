import Link from "next/link";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import LeaveRequestForm from "@/components/LeaveRequestForm";
import MonthYearFilter from "./MonthYearFilter";
import { 
  UserCircle2, Briefcase, Building2, MapPin, Phone, 
  Calendar, Clock, DollarSign, LogOut, ArrowLeft,
  CalendarCheck, AlertCircle, HelpCircle, Wallet
} from 'lucide-react';

const calculateWorkHours = (in1?: string, out1?: string, in2?: string, out2?: string) => {
  let total = 0;
  const getH = (t?: string) => {
    if (!t || t === "-") return 0;
    const [h, m] = t.split(":").map(Number);
    return h + m / 60;
  };
  if (in1 && out1) total += Math.max(0, getH(out1) - getH(in1));
  if (in2 && out2) total += Math.max(0, getH(out2) - getH(in2));
  return total > 0 ? parseFloat(total.toFixed(2)) : 0;
};

const timeToHours = (timeStr?: string) => {
  if (!timeStr || timeStr === '-') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
};

export default async function MyProfile({
  searchParams,
}: {
  searchParams: Promise<{ month?: string, year?: string }> | { month?: string, year?: string };
}) {
  const resolvedParams = await Promise.resolve(searchParams);
  
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('hr_session');
  let empCode = null;
  let session = null;
  
  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie.value);
      if (session.role === 'employee') {
        const { data: emp } = await supabase.from('employees').select('emp_code').eq('id', session.id).single();
        if (emp) empCode = emp.emp_code;
      }
    } catch(e) {}
  }
  
  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = today.getFullYear().toString();
  
  const targetMonth = resolvedParams?.month || currentMonth;
  const targetYear = resolvedParams?.year || currentYear;

  if (!empCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border bborder-slate-200 dark:border-slate-700 max-w-md w-full">
          <p className="text-rose-500 font-bold text-xl mb-6">ไม่พบการเข้าสู่ระบบ</p>
          <Link href="/login" className="inline-block bg-indigo-600 dark:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 transition">
            กลับไปหน้า Login
          </Link>
        </div>
      </div>
    );
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('*, departments(name_th), shifts(*)')
    .eq('emp_code', empCode)
    .single();

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm max-w-md w-full">
          <p className="text-rose-500 font-bold text-xl">ไม่พบข้อมูลพนักงานรหัส: {empCode}</p>
        </div>
      </div>
    );
  }

  let leaveRequests: any[] = [];
  const { data: _leaves } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false });
  leaveRequests = _leaves || [];

  const paddedMonth = targetMonth.toString().padStart(2, '0');
  const startDate = `${targetYear}-${paddedMonth}-01`;
  const endDate = `${targetYear}-${paddedMonth}-31`;

  const { data: attendance } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: false });

  // Calculate OT and KPIs
  let totalWorkDays = 0;
  let lateDays = 0;
  let totalOTHours = 0;
  
  const otStartHour = timeToHours(employee.shifts?.ot_start_time || '18:30');
  
  const processedAttendance = (attendance || []).map((log: any) => {
    let dailyOT = 0;
    
    // Evaluate if worked today
    if (log.time_in_1 && log.time_in_1 !== '-') totalWorkDays++;
    
    // Example late logic: if time_in_1 > shift time_in + 15mins
    const shiftIn = timeToHours(employee.shifts?.time_in || '08:00');
    const actualIn = timeToHours(log.time_in_1);
    if (actualIn > shiftIn + 0.25) lateDays++;

    // Calculate OT
    const pairs = [
      [timeToHours(log.time_in_1), timeToHours(log.time_out_1)],
      [timeToHours(log.time_in_2), timeToHours(log.time_out_2)],
      [timeToHours(log.time_in_3), timeToHours(log.time_out_3)]
    ];
    
    pairs.forEach(([tIn, tOut]) => {
      if (tIn > 0 && tOut > 0 && tOut > otStartHour) {
        const actualOtStart = Math.max(tIn, otStartHour);
        if (tOut > actualOtStart) {
          dailyOT += (tOut - actualOtStart);
        }
      }
    });

    if (dailyOT > 0) totalOTHours += dailyOT;
    
    return { ...log, dailyOT: dailyOT.toFixed(2) };
  });

  const otRate = employee.ot_hourly_rate || 0;
  const estimatedOTPay = (totalOTHours * otRate).toLocaleString('th-TH');

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto font-sans bg-slate-50 dark:bg-slate-900 min-h-screen">
      
      {/* 1. Hero Profile Section */}
      <div className="bg-indigo-600 dark:bg-indigo-500 rounded-3xl p-6 md:p-10 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white dark:bg-slate-800 opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-slate-800/20 rounded-full flex items-center justify-center shrink-0 border-4 border-white/30 backdrop-blur-sm">
            <UserCircle2 className="w-16 h-16 md:w-20 md:h-20 text-white" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{employee.full_name}</h1>
            <p className="text-indigo-200 text-lg md:text-xl font-medium mb-4 flex items-center justify-center md:justify-start gap-2">
              <Briefcase className="w-5 h-5" /> {employee.position} &bull; {employee.departments?.name_th}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="px-4 py-1.5 bg-white dark:bg-slate-800/10 rounded-full text-sm font-bold backdrop-blur-sm border border-white/20">
                รหัส: {employee.emp_code}
              </span>
              <span className="px-4 py-1.5 bg-indigo-800/50 rounded-full text-sm font-bold backdrop-blur-sm border border-indigo-500/30 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-300" />
                กะ: {employee.shifts?.name_th || 'กะปกติ'} 
                ({employee.shifts?.time_in || '08:00'} - {employee.shifts?.time_out || '17:00'})
              </span>
              <span className="px-4 py-1.5 bg-orange-500/20 rounded-full text-sm font-bold backdrop-blur-sm border border-orange-500/50 text-orange-200 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                เริ่มนับ OT: {employee.shifts?.ot_start_time || '18:30'} น.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border bborder-slate-200 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-1">มาทำงาน</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalWorkDays} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">วัน</span></p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border bborder-slate-200 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-1">มาสาย</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{lateDays} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">ครั้ง</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border bborder-slate-200 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-1">ชั่วโมง OT รวม</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalOTHours.toFixed(2)} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">ชม.</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-orange-200 bg-orange-50/30 flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-orange-600 font-bold mb-1">คาดการณ์ได้ OT</p>
            <p className="text-2xl font-black text-orange-700">~{estimatedOTPay} <span className="text-sm font-medium text-orange-600">฿</span></p>
          </div>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border bborder-slate-200 dark:border-slate-700 overflow-hidden">
        {/* We use a simple CSS trick to handle tabs via details/summary or just stack them if we don't use client state.
            Since this is a Server Component, we will display them stacked but beautifully separated, 
            or we can turn this file into a Server Component that wraps a Client Component.
            Let's keep it simple: Stack them cleanly. */}
            
        <div className="p-6 md:p-8 border-b bborder-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ประวัติการทำงาน (เดือน {paddedMonth}/{targetYear})</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">เวลาสแกนเข้า-ออก และชั่วโมงล่วงเวลาประจำวัน</p>
          </div>
          <MonthYearFilter currentMonth={targetMonth.toString()} currentYear={targetYear.toString()} empCode={empCode} />
        </div>

        <div className="overflow-x-auto p-6">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 rounded-tl-xl whitespace-nowrap">วันที่</th>
                <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 whitespace-nowrap">รอบเช้า<br/><span className="text-xs text-slate-400 font-normal">(เข้า - ออก)</span></th>
                <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 whitespace-nowrap">รอบบ่าย<br/><span className="text-xs text-slate-400 font-normal">(เข้า - ออก)</span></th>
                <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 whitespace-nowrap">รอบล่วงเวลา (OT)<br/><span className="text-xs text-slate-400 font-normal">(เข้า - ออก)</span></th>
                <th className="px-4 py-3 text-center font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 rounded-tr-xl whitespace-nowrap">รวม OT<br/><span className="text-xs font-normal">(ชม.)</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedAttendance && processedAttendance.length > 0 ? processedAttendance.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:bg-slate-900 transition">
                  <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{new Date(log.log_date).toLocaleDateString('th-TH')}</td>
                  
                  <td className="px-4 py-4 text-center font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 whitespace-nowrap">
                    <span className="text-emerald-600 dark:text-emerald-400">{log.time_in_1 || '-'}</span> <span className="text-slate-300 mx-1">/</span> <span className="text-rose-600 dark:text-rose-400">{log.time_out_1 || '-'}</span>
                  </td>
                  
                  <td className="px-4 py-4 text-center font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    <span className="text-emerald-600 dark:text-emerald-400">{log.time_in_2 || '-'}</span> <span className="text-slate-300 mx-1">/</span> <span className="text-rose-600 dark:text-rose-400">{log.time_out_2 || '-'}</span>
                  </td>
                  
                  <td className="px-4 py-4 text-center font-medium text-slate-600 dark:text-slate-300 bg-orange-50/10 whitespace-nowrap">
                    <span className="text-orange-600">{log.time_in_3 || '-'}</span> <span className="text-slate-300 mx-1">/</span> <span className="text-orange-700">{log.time_out_3 || '-'}</span>
                  </td>
                  
                  <td className="px-4 py-4 text-center font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 whitespace-nowrap">
                    {Number(log.dailyOT) > 0 ? `+${log.dailyOT}` : '-'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
                    ไม่มีประวัติการทำงานในเดือนนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Management Section */}
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border bborder-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 md:p-8 border-b bborder-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ระบบการลางาน (Leave Management)</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">ยื่นขอลางาน และตรวจสอบสถานะการอนุมัติ</p>
          </div>
          <LeaveRequestForm employeeId={employee.id} />
        </div>
        
        <div className="overflow-x-auto p-6">
          {leaveRequests && leaveRequests.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 rounded-tl-xl">วันที่ยื่นเรื่อง</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">ประเภทการลา</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">วันที่ลา</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">เหตุผลที่ลางาน</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 rounded-tr-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveRequests.map((leave: any) => (
                  <tr key={leave.id} className="hover:bg-slate-50 dark:bg-slate-900 transition">
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400 font-medium">{new Date(leave.created_at).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-4 font-bold text-indigo-600 dark:text-indigo-400">{leave.leave_type}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200 font-medium">{new Date(leave.start_date).toLocaleDateString('th-TH')} - {new Date(leave.end_date).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{leave.reason}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                        leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                        leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border bborder-slate-100 dark:border-slate-700/50">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">ไม่มีประวัติการลางาน</p>
              <p className="text-slate-400 text-sm mt-1">คุณสามารถยื่นขอลางานได้โดยกดปุ่มด้านบนขวา</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
