'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, ClipboardList, Edit, User, Smartphone, Building2, FolderOpen, MapPin, AlertTriangle, Wallet, FileText, CheckCircle, Save, Phone, Circle, UserCircle2, Clock, CalendarOff, LayoutDashboard, Settings, LogOut, BarChart3, Sun, Moon, Monitor, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as xlsx from 'xlsx';
import { saveAs } from 'file-saver';

export default function ReportsPage() {
  // ตั้งค่าเริ่มต้นเป็นเดือนปัจจุบัน (เช่น วันที่ 1 ถึงสิ้นเดือน)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [reportData, setReportData] = useState<{ employees: any[], dates: string[], logsMap: any } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // สร้างอาเรย์ของวันที่ทั้งหมดระหว่าง startDate ถึง endDate
  const getDatesInRange = (start: string, end: string) => {
    const dateArray: string[] = [];
    let currentDate = new Date(start);
    const stopDate = new Date(end);
    
    while (currentDate <= stopDate) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  };

  // ดึงข้อมูลรายงานตามช่วงวันที่เลือก
  const generateReport = async () => {
    if (!startDate || !endDate) return alert('กรุณาเลือกช่วงวันที่ให้ครบถ้วน');
    if (startDate > endDate) return alert('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');

    setIsLoading(true);

    try {
      // 1. ดึงข้อมูลพนักงานทั้งหมด
      const { data: employees } = await supabase
        .from('employees')
        .select('id, emp_code, full_name, department, position')
        .eq('status', 'Active')
        .order('emp_code', { ascending: true });

      // 2. ดึงข้อมูลการลงเวลาตามช่วงวันที่
      const { data: logs } = await supabase
        .from('attendance_logs')
        .select('*')
        .gte('log_date', startDate)
        .lte('log_date', endDate);

      if (!employees) throw new Error("ไม่พบข้อมูลพนักงาน");

      // 3. จัดกลุ่มข้อมูล logs เป็น Map key: "employee_id_log_date" เพื่อให้ค้นหาง่าย
      const logsMap: any = {};
      logs?.forEach(log => {
        const key = `${log.employee_id}_${log.log_date}`;
        logsMap[key] = log;
      });

      const dates = getDatesInRange(startDate, endDate);

      setReportData({ employees, dates, logsMap });

    } catch (error) {
      console.error('Report error:', error);
      alert('เกิดข้อผิดพลาดในการสร้างรายงาน');
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันดาวน์โหลด Excel แบบตารางรายวัน
  const exportToExcel = () => {
    if (!reportData) return alert('ไม่มีข้อมูลสำหรับดาวน์โหลด');

    const { employees, dates, logsMap } = reportData;

    const excelData = employees.map((emp, index) => {
      const row: any = {
        'ลำดับ': index + 1,
        'รหัส': emp.emp_code,
        'ชื่อ-นามสกุล': emp.full_name,
        'แผนก': emp.department || '-',
        'ตำแหน่ง': emp.position || '-'
      };

      // วนลูปใส่ข้อมูลของแต่ละวันลงในคอลัมน์
      dates.forEach(date => {
        const key = `${emp.id}_${date}`;
        const log = logsMap[key];
        
        let statusText = '-';
        if (log) {
          if (log.time_in_1 || log.time_out_1 || log.time_in_2 || log.time_out_2) {
            statusText = '/'; // มาทำงาน
          }
          if (log.remark) {
            statusText = `/${log.remark}`; // มีหมายเหตุ เช่น ลากิจ
          }
        }
        row[date] = statusText;
      });

      return row;
    });

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'รายงานการลงเวลา');

    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    saveAs(data, `รายงานบัตรลงเวลา_${startDate}_ถึง_${endDate}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-full mx-auto font-sans">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition">&larr;</Link>
            รายงานบัตรลงเวลา (รายวัน)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-10 font-medium">กรองข้อมูลตามช่วงวันที่และแสดงตารางเปรียบเทียบรายบุคคล</p>
        </div>
      </div>

      {/* แถบฟิลเตอร์เลือกวันที่ */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border bborder-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row items-end gap-6">
        <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
          <div className="w-full">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">ตั้งแต่วันที่</label>
            <input 
              type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border bborder-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">ถึงวันที่</label>
            <input 
              type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border bborder-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={generateReport} disabled={isLoading}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 font-bold rounded-lg transition shadow-sm
              ${isLoading ? 'bg-slate-300 text-slate-500 dark:text-slate-400' : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white'}`}
          >
            {isLoading ? 'ดึงข้อมูล...' : <><Search className="w-5 h-5" /> ดึงข้อมูล</>}
          </button>
          
          <button 
            onClick={exportToExcel} 
            disabled={!reportData}
            className={`flex-1 md:flex-none px-6 py-2.5 font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-2
              ${!reportData ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border bborder-slate-200 dark:border-slate-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'}`}
          >
            📊 ดาวน์โหลด Excel
          </button>
        </div>
      </div>

      {/* ตารางรายงานแบบ Grid รายวัน */}
      {reportData && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border bborder-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b bborder-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <h2 className="font-bold text-slate-700 dark:text-slate-200">แสดงผลตั้งแต่วันที่ {startDate} ถึง {endDate} ({reportData.dates.length} วัน)</h2>
          </div>
          
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="min-w-full divide-y divide-slate-200 border-collapse text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0 z-20">
                <tr>
                  <th className="px-3 py-3 border bborder-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50 sticky left-0 z-30">ลำดับ</th>
                  <th className="px-3 py-3 border bborder-slate-200 dark:border-slate-700 text-left font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50 sticky left-12 z-30">รหัส</th>
                  <th className="px-4 py-3 border bborder-slate-200 dark:border-slate-700 text-left font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50 sticky left-28 z-35 min-w-[150px]">ชื่อ-นามสกุล</th>
                  
                  {/* วนลูปแสดงหัวตารางเป็นวันที่ */}
                  {reportData.dates.map((date) => {
                    const dayNum = date.split('-')[2]; // ดึงเฉพาะวัน (เช่น 01, 02)
                    return (
                      <th key={date} className="px-2.5 py-3 border bborder-slate-200 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-200 min-w-[50px]">
                        {dayNum}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800">
                {reportData.employees.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:bg-slate-900 transition">
                    <td className="px-3 py-2.5 border bborder-slate-200 dark:border-slate-700 text-center font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 sticky left-0">{index + 1}</td>
                    <td className="px-3 py-2.5 border bborder-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 sticky left-12">{emp.emp_code}</td>
                    <td className="px-4 py-2.5 border bborder-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 sticky left-28 whitespace-nowrap">{emp.full_name}</td>
                    
                    {/* วนลูปเช็คข้อมูลการลงเวลาของแต่ละวัน */}
                    {reportData.dates.map((date) => {
                      const key = `${emp.id}_${date}`;
                      const log = reportData.logsMap[key];
                      
                      let statusDisplay = '-';
                      let isPresent = false;

                      if (log) {
                        if (log.time_in_1 || log.time_out_1 || log.time_in_2 || log.time_out_2) {
                          isPresent = true;
                          statusDisplay = '/';
                        }
                        if (log.remark) {
                          statusDisplay = log.remark; // แสดงหมายเหตุย่อ เช่น ลากิจ
                        }
                      }

                      return (
                        <td key={date} className={`px-2.5 py-2.5 border bborder-slate-200 dark:border-slate-700 text-center font-bold ${isPresent ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/20' : 'text-slate-300'}`}>
                          {statusDisplay}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}