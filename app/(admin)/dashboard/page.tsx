'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, ClipboardList, Edit, User, Smartphone, Building2, FolderOpen, MapPin, AlertTriangle, Wallet, FileText, CheckCircle, Save, Phone, Circle, UserCircle2, Clock, CalendarOff, LayoutDashboard, Settings, LogOut, BarChart3, Sun, Moon, Monitor, Flame, Calendar as CalendarIcon, UserSearch, Cast, X } from 'lucide-react';
import Swal from 'sweetalert2';
import ThaiDatePicker from '@/components/ThaiDatePicker';
import { supabase } from '@/lib/supabase';
import TablePagination from '@/components/TablePagination';
import ExecutiveChart from '@/components/ExecutiveChart';
import SymbolReport from '@/components/SymbolReport';
import DetailedTimeReport from '@/components/DetailedTimeReport';

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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'symbol' | 'detailed'>('overview');
  const [rawEmployees, setRawEmployees] = useState<any[]>([]);
  const [rawLogs, setRawLogs] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [otSetting, setOtSetting] = useState<string>('18:30');
  const [holidays, setHolidays] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dateRangeType, setDateRangeType] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);

  // 🌟 State สำหรับ Presentation Mode
  const [isPresentationActive, setIsPresentationActive] = useState(false);
  const [presentationData, setPresentationData] = useState<any>(null);

  useEffect(() => {
    // Check initial presentation state
    fetch('/api/presentation').then(res => res.json()).then(data => {
      if (data.success && data.data) {
        setIsPresentationActive(data.data.is_active === 1);
        let payload = data.data.payload;
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch(e) {}
        }
        setPresentationData(payload);
      }
    }).catch(console.error);
  }, []);

  const startPresentation = async (viewMode: string, title: string, payload: any) => {
    try {
      const res = await fetch('/api/presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true, view_mode: viewMode, title, payload })
      });
      const result = await res.json();
      if (result.success) {
        setIsPresentationActive(true);
        Swal.fire({
          icon: 'success',
          title: 'เริ่มนำเสนอแล้ว',
          text: 'ผู้เข้าร่วมสามารถเปิดลิงก์ /live เพื่อดูหน้าจอนี้ได้ทันที',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเริ่มนำเสนอ');
    }
  };

  const stopPresentation = async () => {
    try {
      const res = await fetch('/api/presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false })
      });
      const result = await res.json();
      if (result.success) {
        setIsPresentationActive(false);
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการหยุดนำเสนอ');
    }
  };

  // 🌟 State สำหรับการค้นหาและตัวกรองตาราง
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // 🌟 State สำหรับ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 🌟 State สำหรับการเรียงลำดับ (Sorting)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'emp_code', 
    direction: 'asc' 
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 🌟 State สำหรับ Modal กดดูกราฟ
  const [selectedChartDetail, setSelectedChartDetail] = useState<{ date: string, category: string, categoryName: string, employees: any[] } | null>(null);

  // 1. Fetch ข้อมูลดิบจาก Database (เมื่อเปลี่ยนวันที่)
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const { data: deptData } = await supabase.from('departments').select('*').order('code');
        setDepartments(deptData || []);

        const { data: empData } = await supabase
          .from('employees')
          .select('id, emp_code, full_name, position, status, created_at, departments(name_th)')
          .order('emp_code', { ascending: true });
        
        setRawEmployees(empData || []);

        let startDate = customStart;
        let endDate = customEnd;
        const todayStr = new Date().toISOString().split('T')[0];

        if (dateRangeType === 'today') {
          startDate = todayStr; endDate = todayStr;
        } else if (dateRangeType === 'week') {
          const d = new Date(); d.setDate(d.getDate() - 6);
          startDate = d.toISOString().split('T')[0];
          endDate = todayStr;
        } else if (dateRangeType === 'month') {
          const d = new Date(); d.setDate(d.getDate() - 29);
          startDate = d.toISOString().split('T')[0];
          endDate = todayStr;
        }

        const { data: shiftsData } = await supabase.from('shifts').select('*');
        const { data: settingData } = await supabase.from('shift_settings').select('ot_in_end').eq('id', 1).single();
        const { data: holidaysData } = await supabase.from('holidays').select('*').gte('holiday_date', startDate).lte('holiday_date', endDate);

        const { data: logs } = await supabase
          .from('attendance_logs')
          .select('*')
          .gte('log_date', startDate)
          .lte('log_date', endDate)
          .order('log_date', { ascending: true });

        setRawLogs(logs || []);
        setShifts(shiftsData || []);
        setOtSetting(settingData?.ot_in_end || '18:30');
        setHolidays(holidaysData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRangeType, customStart, customEnd]);

  // 2. กรองพนักงาน (ตาม Search, Dept, Status)
  const processedEmployees = useMemo(() => {
    let result = [...rawEmployees];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.full_name && emp.full_name.toLowerCase().includes(lowerSearch)) ||
        (emp.emp_code && emp.emp_code.toLowerCase().includes(lowerSearch))
      );
    }

    if (filterDept !== 'All') {
      result = result.filter(emp => emp.departments?.name_th === filterDept);
    }

    if (filterStatus !== 'All') {
      result = result.filter(emp => emp.status === filterStatus);
    }

    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'department') {
        aValue = a.departments?.name_th || '';
        bValue = b.departments?.name_th || '';
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [rawEmployees, searchTerm, filterDept, filterStatus, sortConfig]);

  const tableEmployees = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tableDate = dateRangeType === 'today' ? todayStr : (dateRangeType === 'custom' ? customEnd : todayStr);
    
    // Create an array of dates in the range for holiday calculation
    const dateArray: string[] = [];
    let currentDate = new Date(customStart);
    const stopDate = new Date(customEnd);
    if (dateRangeType === 'today') {
      dateArray.push(todayStr);
    } else {
      while (currentDate <= stopDate) {
        dateArray.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return processedEmployees.map(emp => {
      const logToday = rawLogs.find(a => a.employee_id === emp.id && a.log_date === tableDate);
      let todayStatus = 'หยุด/ยังไม่เข้างาน';
      let isMissing = false;
      let isLeave = false;

      if (logToday) {
        const hasTimeIn = logToday.time_in_1 || logToday.time_in_2;
        isMissing = (logToday.time_in_1 && !logToday.time_out_1) || (logToday.time_in_2 && !logToday.time_out_2);
        isLeave = !hasTimeIn && !!logToday.remark;
        
        if (isMissing) {
          todayStatus = 'ลืมสแกนออก';
        } else if (hasTimeIn) {
          todayStatus = 'เข้างานปกติ';
        } else if (isLeave) {
          todayStatus = `ลา/มีปัญหา (${logToday.remark})`;
        }
      }

      // Calculate Period Stats
      const empLogs = rawLogs.filter(a => a.employee_id === emp.id);
      let presentDays = 0;
      let leaveDays = 0;
      let totalOT = 0;

      const empShift = shifts.find(s => s.id === emp.shift_id);
      const otSettingStart = timeToHours(empShift?.ot_start_time || otSetting);

      // We need to loop over dates to handle "Paid Holidays" logic
      dateArray.forEach(dateStr => {
        const log = empLogs.find(l => l.log_date === dateStr);
        const isHoliday = holidays.some(h => h.holiday_date === dateStr);

        if (log) {
          const hasTimeIn = log.time_in_1 || log.time_in_2;
          const isL = !hasTimeIn && !!log.remark;
          
          if (hasTimeIn) presentDays++;
          else if (isL) leaveDays++;

          // Calculate OT
          const in1 = timeToHours(log.time_in_1); const out1 = timeToHours(log.time_out_1);
          const in2 = timeToHours(log.time_in_2); const out2 = timeToHours(log.time_out_2);
          const in3 = timeToHours(log.time_in_3); const out3 = timeToHours(log.time_out_3);
          const in4 = timeToHours(log.time_in_4); const out4 = timeToHours(log.time_out_4);
          
          const pairs = [[in1, out1], [in2, out2], [in3, out3], [in4, out4]];
          pairs.forEach(([tIn, tOut]) => {
            if (tIn > 0 && tOut > 0 && tOut > otSettingStart) {
              const actualOtStart = Math.max(tIn, otSettingStart);
              if (tOut > actualOtStart) {
                totalOT += (tOut - actualOtStart);
              }
            }
          });
        } else if (isHoliday) {
          // If no log but it's a holiday, count as a "Paid Work Day" logically
          // Depending on rules, maybe it's added to presentDays to show they get paid
          presentDays++;
        }
      });

      return { ...emp, todayStatus, isMissingPunch: isMissing, isLeave, presentDays, leaveDays, totalOT };
    });
  }, [processedEmployees, rawLogs, dateRangeType, customStart, customEnd, shifts, otSetting, holidays]);


  // 4. คำนวณ Chart และ Stats จากพนักงานที่ผ่านการกรองแล้ว (ทำให้กราฟแสดงเฉพาะคนที่ค้นหาได้)
  const { chartData, stats } = useMemo(() => {
    let startDate = customStart;
    let endDate = customEnd;
    const todayStr = new Date().toISOString().split('T')[0];

    if (dateRangeType === 'today') {
      startDate = todayStr; endDate = todayStr;
    } else if (dateRangeType === 'week') {
      const d = new Date(); d.setDate(d.getDate() - 6);
      startDate = d.toISOString().split('T')[0];
      endDate = todayStr;
    } else if (dateRangeType === 'month') {
      const d = new Date(); d.setDate(d.getDate() - 29);
      startDate = d.toISOString().split('T')[0];
      endDate = todayStr;
    }

    const activeCount = processedEmployees.filter(e => e.status === 'Active').length;
    const validEmpIds = new Set(processedEmployees.map(e => e.id));
    const filteredLogs = rawLogs.filter(l => validEmpIds.has(l.employee_id));

    const aggregated: Record<string, any> = {};
    let curr = new Date(startDate);
    const endObj = new Date(endDate);
    
    while(curr <= endObj) {
      const dateStr = curr.toISOString().split('T')[0];
      aggregated[dateStr] = { 
        date: dateStr, 
        present: 0, 
        missingPunch: 0, 
        leave: 0, 
        absent: activeCount 
      };
      curr.setDate(curr.getDate() + 1);
    }

    let totalPresentAllDays = 0;
    let daysCount = Object.keys(aggregated).length;

    filteredLogs.forEach(log => {
      const dateStr = log.log_date;
      if (aggregated[dateStr]) {
        const hasTimeIn = log.time_in_1 || log.time_in_2;
        const isMissingPunch = (log.time_in_1 && !log.time_out_1) || (log.time_in_2 && !log.time_out_2);
        const isLeave = !hasTimeIn && log.remark && log.remark.trim() !== '';

        if (isMissingPunch) {
          aggregated[dateStr].missingPunch++;
          aggregated[dateStr].absent--;
          totalPresentAllDays++; 
        } else if (hasTimeIn) {
          aggregated[dateStr].present++;
          aggregated[dateStr].absent--;
          totalPresentAllDays++;
        } else if (isLeave) {
          aggregated[dateStr].leave++;
          aggregated[dateStr].absent--;
        }
      }
    });

    const tableDate = dateRangeType === 'today' ? todayStr : endDate;
    const todayAttendanceCount = filteredLogs.filter(l => l.log_date === tableDate && (l.time_in_1 || l.time_in_2)).length;

    return {
      chartData: Object.values(aggregated),
      stats: {
        totalEmployees: processedEmployees.length,
        activeEmployees: activeCount,
        avgPresent: daysCount > 0 ? Math.round(totalPresentAllDays / daysCount) : 0,
        todayAttendance: todayAttendanceCount,
      }
    };
  }, [processedEmployees, rawLogs, dateRangeType, customStart, customEnd]);

  // 🌟 คำนวณ Pagination
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return tableEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [tableEmployees, currentPage, itemsPerPage]);

  const viewEmployeeStats = (empCode: string) => {
    setSearchTerm(empCode);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChartClick = (date: string, categoryKey: string) => {
    const categoryName: any = {
      present: 'มาทำงานปกติ',
      leave: 'ลา / มีปัญหา',
      missingPunch: 'ลืมสแกนออก',
      absent: 'หยุด / ขาดงาน'
    }[categoryKey] || categoryKey;

    const targetLogs = rawLogs.filter(l => l.log_date === date);
    
    const matchingEmployees = processedEmployees.filter(emp => {
      const log = targetLogs.find(a => a.employee_id === emp.id);
      let isPresent = false;
      let isMissing = false;
      let isLeave = false;
      let isAbsent = true;

      if (log) {
        const hasTimeIn = log.time_in_1 || log.time_in_2;
        isMissing = (log.time_in_1 && !log.time_out_1) || (log.time_in_2 && !log.time_out_2);
        isLeave = !hasTimeIn && !!log.remark;
        
        if (isMissing) {
          isAbsent = false;
        } else if (hasTimeIn) {
          isPresent = true;
          isAbsent = false;
        } else if (isLeave) {
          isAbsent = false;
        }
      }

      if (categoryKey === 'present') return isPresent;
      if (categoryKey === 'missingPunch') return isMissing;
      if (categoryKey === 'leave') return isLeave;
      if (categoryKey === 'absent') return isAbsent;
      return false;
    });

    setSelectedChartDetail({
      date,
      category: categoryKey,
      categoryName,
      employees: matchingEmployees
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto min-h-screen animate-in fade-in duration-500">
      
      {/* Presentation Banner */}
      {isPresentationActive && (
        <div className="mb-6 p-4 bg-apple-blue text-white rounded-[24px] shadow-[var(--shadow-apple-soft)] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full animate-pulse">
              <Cast className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">กำลังนำเสนอผ่าน Public Link</h3>
              <p className="text-emerald-100 text-sm">ผู้เข้าร่วมสามารถสแกน QR Code หรือเข้าลิงก์ /live เพื่อดูหน้าจอนี้ได้</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/live" target="_blank" rel="noreferrer" className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition flex items-center gap-2">
              <Eye className="w-4 h-4" /> ดูหน้าจอนำเสนอ
            </a>
            <button onClick={stopPresentation} className="px-4 py-2 bg-white text-emerald-600 hover:bg-slate-50 font-bold rounded-xl transition shadow-sm flex items-center gap-2">
              <X className="w-4 h-4" /> หยุดนำเสนอ
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--apple-text-primary)] flex items-center gap-3">
            ศูนย์กลางข้อมูลผู้บริหาร (Dashboard)
            {searchTerm && (
              <span className="text-sm bg-apple-blue/10 text-apple-blue px-3 py-1 rounded-[980px] font-bold flex items-center gap-1">
                <UserSearch className="w-4 h-4" /> ดูข้อมูลเฉพาะ: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="ml-2 opacity-70 hover:opacity-100">✕</button>
              </span>
            )}
          </h1>
          <p className="text-[var(--apple-text-secondary)] mt-1 font-medium">ภาพรวมระบบ สถิติการลงเวลาแบบละเอียด และการค้นหาพนักงาน</p>
        </div>
        
        {/* Executive Date Filter - แบบครบครัน */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-black/20 p-2 rounded-[24px] shadow-[var(--shadow-apple-soft)] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center pl-2 text-[var(--apple-text-secondary)]">
            <CalendarIcon className="w-5 h-5 mr-2" />
            <span className="text-sm font-bold mr-2">ช่วงเวลา:</span>
          </div>
          
          <select 
            value={dateRangeType}
            onChange={(e) => setDateRangeType(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[var(--apple-text-primary)] font-bold rounded-[980px] outline-none focus:ring-2 focus:ring-apple-blue cursor-pointer transition"
          >
            <option value="today">วันนี้</option>
            <option value="week">7 วันล่าสุด</option>
            <option value="month">30 วันล่าสุด</option>
            <option value="custom">กำหนดเอง (ระบุ ว/ด/ป)...</option>
          </select>

          {dateRangeType === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <ThaiDatePicker 
                value={customStart}
                onChange={(val) => setCustomStart(val)}
                className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[980px] outline-none text-sm font-medium focus:ring-2 focus:ring-apple-blue"
              />
              <span className="text-[var(--apple-text-secondary)] font-medium">ถึง</span>
              <ThaiDatePicker 
                value={customEnd}
                onChange={(val) => setCustomEnd(val)}
                className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[980px] outline-none text-sm font-medium focus:ring-2 focus:ring-apple-blue"
              />
            </div>
          )}

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

          <Link href="/attendance" className="px-5 py-2 bg-apple-blue text-white font-bold rounded-[980px] hover:opacity-90 shadow-sm transition flex items-center">
            <Clock className="w-4 h-4 mr-2" /> บันทึกเวลา
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 font-bold text-sm rounded-t-[12px] transition flex items-center gap-2 whitespace-nowrap
            ${activeTab === 'overview' ? 'text-[var(--apple-text-primary)] border-b-[3px] border-apple-blue' : 'text-[var(--apple-text-secondary)] hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          <LayoutDashboard className="w-4 h-4" /> ภาพรวมสถิติ
        </button>
        <button 
          onClick={() => setActiveTab('symbol')}
          className={`px-4 py-2.5 font-bold text-sm rounded-t-[12px] transition flex items-center gap-2 whitespace-nowrap
            ${activeTab === 'symbol' ? 'text-[var(--apple-text-primary)] border-b-[3px] border-apple-blue' : 'text-[var(--apple-text-secondary)] hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          <BarChart3 className="w-4 h-4" /> รายงานแบบสัญลักษณ์
        </button>
        <button 
          onClick={() => setActiveTab('detailed')}
          className={`px-4 py-2.5 font-bold text-sm rounded-t-[12px] transition flex items-center gap-2 whitespace-nowrap
            ${activeTab === 'detailed' ? 'text-[var(--apple-text-primary)] border-b-[3px] border-apple-blue' : 'text-[var(--apple-text-secondary)] hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          <FileText className="w-4 h-4" /> รายงานแบบเวลาละเอียด
        </button>
      </div>

      {activeTab === 'symbol' && <SymbolReport />}
      {activeTab === 'detailed' && <DetailedTimeReport />}
      
      <div className={activeTab === 'overview' ? 'block' : 'hidden'}>

      {isLoading ? (
        <div className="text-center p-16 text-[var(--apple-text-secondary)] font-medium animate-pulse text-lg flex flex-col items-center justify-center">
          <svg className="animate-spin h-8 w-8 mb-4 text-apple-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          กำลังวิเคราะห์ข้อมูล...
        </div>
      ) : (
        <>
          {/* 🌟 Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-black/20 rounded-[24px] p-5 shadow-[var(--shadow-apple-soft)] border border-slate-200 dark:border-slate-800 flex flex-col">
              <span className="text-[var(--apple-text-secondary)] font-semibold text-sm mb-1">จำนวนที่ค้นพบ</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-[var(--apple-text-primary)]">{stats.totalEmployees}</span>
                <span className="text-[var(--apple-text-secondary)] font-medium mb-1">คน</span>
              </div>
            </div>
            <div className="bg-white dark:bg-black/20 rounded-[24px] p-5 shadow-[var(--shadow-apple-soft)] border border-slate-200 dark:border-slate-800 flex flex-col">
              <span className="text-[var(--apple-text-secondary)] font-semibold text-sm mb-1">กำลังทำงานอยู่ (Active)</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.activeEmployees}</span>
                <span className="text-[var(--apple-text-secondary)] font-medium mb-1">คน</span>
              </div>
            </div>
            <div className="bg-white dark:bg-black/20 rounded-[24px] p-5 shadow-[var(--shadow-apple-soft)] border border-slate-200 dark:border-slate-800 flex flex-col">
              <span className="text-[var(--apple-text-secondary)] font-semibold text-sm mb-1">เฉลี่ยมาทำงานต่อวัน (ช่วงเวลา)</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-apple-blue">{stats.avgPresent}</span>
                <span className="text-[var(--apple-text-secondary)] font-medium mb-1">คน/วัน</span>
              </div>
            </div>
            <div className="bg-white dark:bg-black/20 rounded-[24px] p-5 shadow-[var(--shadow-apple-soft)] border border-slate-200 dark:border-slate-800 flex flex-col">
              <span className="text-[var(--apple-text-secondary)] font-semibold text-sm mb-1">มาทำงานล่าสุด ({dateRangeType === 'today' ? 'วันนี้' : customEnd})</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-apple-blue">{stats.todayAttendance}</span>
                <span className="text-[var(--apple-text-secondary)] font-medium mb-1">คน</span>
              </div>
            </div>
          </div>

          {/* 🌟 Executive Chart Section */}
          <div className="mb-8 relative">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button 
                onClick={() => startPresentation('executive', 'วิเคราะห์พฤติกรรมการลงเวลา', { chartData, dateRangeType, customStart, customEnd })}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
              >
                <Cast className="w-3 h-3" /> นำเสนอกราฟนี้
              </button>
            </div>
            <ExecutiveChart 
              title={`วิเคราะห์พฤติกรรมการลงเวลา (${dateRangeType === 'today' ? 'วันนี้' : dateRangeType === 'week' ? '7 วันล่าสุด' : dateRangeType === 'month' ? '30 วันล่าสุด' : `${customStart} ถึง ${customEnd}`})`}
              data={chartData} 
              xKey="date" 
              series={[
                { key: 'present', name: 'มาทำงานปกติ', color: '#10b981' }, // Emerald
                { key: 'leave', name: 'ลา / มีปัญหา', color: '#eab308' }, // Yellow
                { key: 'missingPunch', name: 'ลืมสแกนออก', color: '#f97316' }, // Orange
                { key: 'absent', name: 'หยุด / ขาดงาน', color: '#94a3b8' } // Slate
              ]}
              onDataClick={handleChartClick}
            />
          </div>

          {/* 🌟 Data Table Section with Advanced Controls & Pagination */}
          <div className="bg-white dark:bg-black/20 rounded-[24px] shadow-[var(--shadow-apple-soft)] border border-slate-200 dark:border-slate-800 flex flex-col">
            
            {/* Action Bar: Search & Filters */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-black/5 dark:bg-white/5 rounded-t-[24px] flex flex-col md:flex-row gap-4 items-center justify-between">
              
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[var(--apple-text-primary)] mr-2">ข้อมูลรายบุคคล</h3>
                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--apple-text-secondary)]"><Search className="w-4 h-4 absolute left-3 top-2.5" /></span>
                  <input 
                    type="text" 
                    placeholder="ค้นหารหัส, ชื่อ..." 
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-[980px] outline-none text-sm font-medium focus:border-apple-blue focus:ring-1 focus:ring-apple-blue transition"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select 
                  value={filterDept} 
                  onChange={(e) => {
                    setFilterDept(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-[980px] outline-none font-bold text-[var(--apple-text-primary)] text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                >
                  <option value="All">ทุกแผนก</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name_th}>{d.name_th}</option>
                  ))}
                </select>

                <select 
                  value={filterStatus} 
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-[980px] outline-none font-bold text-[var(--apple-text-primary)] text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                >
                  <option value="All">ทุกสถานะ</option>
                  <option value="Active">ทำงานอยู่ (Active)</option>
                  <option value="Inactive">พ้นสภาพ (Inactive)</option>
                </select>
              </div>
            </div>

            {/* Table Area (Scrollable) */}
            <div className="overflow-x-auto min-h-[300px]">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 relative">
                <thead className="bg-black/5 dark:bg-white/5 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th onClick={() => handleSort('emp_code')} className="px-6 py-3 text-left text-xs font-black text-[var(--apple-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition group select-none">
                      รหัส {sortConfig.key === 'emp_code' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('full_name')} className="px-6 py-3 text-left text-xs font-black text-[var(--apple-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition group select-none">
                      ชื่อ-นามสกุล {sortConfig.key === 'full_name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('department')} className="px-6 py-3 text-left text-xs font-black text-[var(--apple-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition group select-none">
                      แผนก / ตำแหน่ง {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      สถานะวันที่ ({dateRangeType === 'today' ? 'วันนี้' : (dateRangeType === 'custom' ? customEnd : new Date().toISOString().split('T')[0])})
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      ทำงาน (วัน)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      หยุด/ลา (วัน)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      รวม OT (ชม.)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      เจาะลึก
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800">
                  {paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <Search className="w-8 h-8 mb-3 text-slate-300" />
                          <div className="font-bold text-lg">ไม่พบข้อมูลที่ค้นหา</div>
                          <p className="text-sm">ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองดูนะครับ</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((emp) => (
                      <tr key={emp.id} className={`hover:bg-indigo-50/50 transition ${emp.isMissingPunch ? 'bg-orange-50/70' : emp.isLeave ? 'bg-yellow-50/50' : ''}`}>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="font-black text-slate-800 dark:text-slate-100">{emp.emp_code}</div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-700 dark:text-slate-200">{emp.full_name}</div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {emp.departments?.name_th || '-'}
                          </span>
                          {emp.position && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-2">{emp.position}</span>}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                            emp.isMissingPunch ? 'bg-orange-100 text-orange-700 border-orange-300 animate-pulse' : 
                            emp.isLeave ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                            (emp.todayStatus === 'เข้างานปกติ' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200')
                          }`}>
                            {emp.todayStatus}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-center font-bold text-slate-700 dark:text-slate-300">
                          {emp.presentDays}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-center font-bold text-rose-600 dark:text-rose-400">
                          {emp.leaveDays}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-center font-bold text-orange-600 dark:text-orange-400">
                          {emp.totalOT > 0 ? emp.totalOT.toFixed(1) : '-'}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-center">
                          <button 
                            onClick={() => viewEmployeeStats(emp.emp_code)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold transition shadow-sm"
                            title={`ดูสถิติของ ${emp.full_name}`}
                          >
                            <UserSearch className="w-4 h-4" /> ดูกราฟคนนี้
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <TablePagination
              totalItems={processedEmployees.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />

          </div>
        </>
      )}

      {/* 🌟 Modal สำหรับแสดงรายชื่อพนักงานที่คลิกจากกราฟ */}
      {selectedChartDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                  รายชื่อพนักงาน: <span className="text-indigo-600 dark:text-indigo-400">{selectedChartDetail.categoryName}</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">ประจำวันที่ {selectedChartDetail.date} (จำนวน {selectedChartDetail.employees.length} คน)</p>
              </div>
              <button 
                onClick={() => setSelectedChartDetail(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                  <tr>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">รหัส</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">ชื่อ-นามสกุล</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">แผนก</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {selectedChartDetail.employees.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">ไม่มีข้อมูล</td></tr>
                  ) : (
                    selectedChartDetail.employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{emp.emp_code}</td>
                        <td className="p-3 font-medium text-slate-600 dark:text-slate-300">{emp.full_name}</td>
                        <td className="p-3 text-sm text-slate-500">{emp.departments?.name_th || '-'}</td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => {
                              setSelectedChartDetail(null);
                              viewEmployeeStats(emp.emp_code);
                            }}
                            className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition"
                          >
                            ดูประวัติ
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>

    </div>
  );
}