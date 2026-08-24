'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, ClipboardList, Edit, User, Smartphone, Building2, FolderOpen, MapPin, AlertTriangle, Wallet, FileText, CheckCircle, Save, Phone, Circle, UserCircle2, Clock, CalendarOff, LayoutDashboard, Settings, LogOut, BarChart3, Sun, Moon, Monitor, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalDepartments: 0,
    todayAttendance: 0,
  });
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 State สำหรับการค้นหาและตัวกรอง (Search & Filter)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // 🌟 State สำหรับการเรียงลำดับ (Sorting)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'emp_code', 
    direction: 'asc' 
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // 1. ดึงข้อมูลแผนกทั้งหมด (สำหรับทำ Dropdown Filter)
        const { data: deptData } = await supabase.from('departments').select('*').order('code');
        setDepartments(deptData || []);

        // 2. ดึงข้อมูลพนักงานทั้งหมด พร้อมแผนก
        const { data: empData } = await supabase
          .from('employees')
          .select('id, emp_code, full_name, position, status, created_at, departments(name_th)')
          .order('emp_code', { ascending: true });
        
        const validEmployees = empData || [];
        setEmployees(validEmployees);

        // 3. คำนวณ Stats ด้านบน
        const activeCount = validEmployees.filter(e => e.status === 'Active').length;
        
        const today = new Date().toISOString().split('T')[0];
        const { count: todayAtt } = await supabase
          .from('attendance_logs')
          .select('*', { count: 'exact', head: true })
          .eq('log_date', today);

        setStats({
          totalEmployees: validEmployees.length,
          activeEmployees: activeCount,
          totalDepartments: deptData?.length || 0,
          todayAttendance: todayAtt || 0,
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 🌟 ฟังก์ชันจัดการการคลิกเรียงลำดับ (Sort)
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 🌟 Logic การกรองและเรียงลำดับข้อมูล (ทำงานแบบ Real-time)
  const processedEmployees = useMemo(() => {
    let result = [...employees];

    // 1. ค้นหา (Search) จากรหัสหรือชื่อ
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.full_name && emp.full_name.toLowerCase().includes(lowerSearch)) ||
        (emp.emp_code && emp.emp_code.toLowerCase().includes(lowerSearch))
      );
    }

    // 2. กรองตามแผนก (Filter by Department)
    if (filterDept !== 'All') {
      result = result.filter(emp => emp.departments?.name_th === filterDept);
    }

    // 3. กรองตามสถานะ (Filter by Status)
    if (filterStatus !== 'All') {
      result = result.filter(emp => emp.status === filterStatus);
    }

    // 4. เรียงลำดับ (Sort)
    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // กรณีเรียงตามชื่อแผนก (Nested Object)
      if (sortConfig.key === 'department') {
        aValue = a.departments?.name_th || '';
        bValue = b.departments?.name_th || '';
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [employees, searchTerm, filterDept, filterStatus, sortConfig]);


  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto font-sans bg-slate-50 dark:bg-slate-900 min-h-screen">
      
      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">ศูนย์กลางข้อมูล (Dashboard)</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">ภาพรวมระบบ จัดการและค้นหาข้อมูลพนักงานแบบรวดเร็ว</p>
        </div>
        <div className="flex gap-2">
          <Link href="/attendance" className="px-4 py-2 bg-white dark:bg-slate-800 border bborder-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:bg-slate-900 shadow-sm transition">
            <Clock className="w-5 h-5 mr-2 inline-block" /> ดูบันทึกเวลา
          </Link>
          <Link href="/employees" className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition">
            <Plus className="w-5 h-5 inline-block" /> เพิ่มพนักงาน
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-16 text-slate-400 font-bold animate-pulse text-lg">กำลังประมวลผลข้อมูล...</div>
      ) : (
        <>
          {/* 🌟 Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border bborder-slate-200 dark:border-slate-700 flex flex-col">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1">พนักงานทั้งหมด</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{stats.totalEmployees}</span>
                <span className="text-slate-400 font-medium mb-1">คน</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border bborder-slate-200 dark:border-slate-700 flex flex-col border-l-4 border-l-emerald-500">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1">กำลังทำงานอยู่ (Active)</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{stats.activeEmployees}</span>
                <span className="text-slate-400 font-medium mb-1">คน</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border bborder-slate-200 dark:border-slate-700 flex flex-col">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1">แผนกทั้งหมด</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-sky-600">{stats.totalDepartments}</span>
                <span className="text-slate-400 font-medium mb-1">แผนก</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border bborder-slate-200 dark:border-slate-700 flex flex-col border-l-4 border-l-indigo-500">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1">ข้อมูลสแกนนิ้ววันนี้</span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{stats.todayAttendance}</span>
                <span className="text-slate-400 font-medium mb-1">รายการ</span>
              </div>
            </div>
          </div>

          {/* 🌟 Data Table Section with Advanced Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border bborder-slate-200 dark:border-slate-700 flex flex-col h-[700px]">
            
            {/* Action Bar: Search & Filters */}
            <div className="p-4 border-b bborder-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" /></span>
                <input 
                  type="text" 
                  placeholder="ค้นหาด้วยรหัส หรือ ชื่อพนักงาน..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border bborder-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select 
                  value={filterDept} 
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border bborder-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-600 dark:text-slate-300 text-sm cursor-pointer hover:bg-slate-50 dark:bg-slate-900 transition"
                >
                  <option value="All">ทุกแผนก</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name_th}>{d.name_th}</option>
                  ))}
                </select>

                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border bborder-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-600 dark:text-slate-300 text-sm cursor-pointer hover:bg-slate-50 dark:bg-slate-900 transition"
                >
                  <option value="All">ทุกสถานะ</option>
                  <option value="Active">กำลังทำงาน (Active)</option>
                  <option value="Inactive">พ้นสภาพ (Inactive)</option>
                </select>
              </div>
            </div>

            {/* Table Area (Scrollable) */}
            <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 relative">
                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                  <tr>
                    {/* เรียงลำดับ รหัสพนักงาน */}
                    <th onClick={() => handleSort('emp_code')} className="px-6 py-4 text-left text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:bg-slate-800/50 transition group select-none">
                      รหัสพนักงาน {sortConfig.key === 'emp_code' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    {/* เรียงลำดับ ชื่อ */}
                    <th onClick={() => handleSort('full_name')} className="px-6 py-4 text-left text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:bg-slate-800/50 transition group select-none">
                      ชื่อ-นามสกุล {sortConfig.key === 'full_name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    {/* เรียงลำดับ แผนก */}
                    <th onClick={() => handleSort('department')} className="px-6 py-4 text-left text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:bg-slate-800/50 transition group select-none">
                      แผนก / ตำแหน่ง {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    {/* เรียงลำดับ สถานะ */}
                    <th onClick={() => handleSort('status')} className="px-6 py-4 text-center text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:bg-slate-800/50 transition group select-none">
                      สถานะ {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800">
                  {processedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                        <div className="text-4xl mb-2"><Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" /></div>
                        <div className="font-bold text-lg">ไม่พบข้อมูลที่ค้นหา</div>
                        <p className="text-sm">ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองดูนะครับ</p>
                      </td>
                    </tr>
                  ) : (
                    processedEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-indigo-50/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-black text-slate-800 dark:text-slate-100">{emp.emp_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-700 dark:text-slate-200">{emp.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border bborder-slate-200 dark:border-slate-700">
                            {emp.departments?.name_th || 'ไม่ระบุแผนก'}
                          </span>
                          {emp.position && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-2">{emp.position}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {emp.status === 'Active' ? 'ทำงานอยู่' : 'พ้นสภาพ'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer สรุปจำนวน */}
            <div className="p-4 border-t bborder-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-sm text-slate-500 dark:text-slate-400 font-bold flex justify-between items-center rounded-b-2xl">
              <span>แสดงผลทั้งหมด {processedEmployees.length} รายการ</span>
              {searchTerm && <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 px-2 py-1 rounded-md">กำลังค้นหา: "{searchTerm}"</span>}
            </div>

          </div>
        </>
      )}
    </div>
  );
}