'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, CheckCircle, XCircle, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leaves');
      const data = await res.json();
      if (data.success) {
        setLeaves(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch('/api/leaves', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    if (res.ok) {
      Swal.fire({ icon: 'success', title: 'อัปเดตสถานะสำเร็จ', timer: 1500, showConfirmButton: false });
      fetchLeaves();
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto font-sans">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition">&larr;</Link>
            ระบบจัดการการลางาน
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-10 font-medium">อนุมัติหรือปฏิเสธคำขอการลางานของพนักงาน</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto p-6">
          {isLoading ? (
            <p className="text-center py-4 dark:text-slate-400">กำลังโหลดข้อมูล...</p>
          ) : leaves.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">วันที่ยื่น</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">พนักงาน</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">ประเภท</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">วันที่ลา</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">เหตุผล</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">สถานะ</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaves.map((leave: any) => (
                  <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(leave.created_at).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{leave.employees?.full_name} <span className="text-xs text-slate-400 block">{leave.employees?.emp_code}</span></td>
                    <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{leave.leave_type}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(leave.start_date).toLocaleDateString('th-TH')} - {new Date(leave.end_date).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded-lg flex items-center gap-1 w-max
                        ${leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                        {leave.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                        {leave.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {leave.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {leave.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateStatus(leave.id, 'Approved')} className="p-1.5 bg-emerald-50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg" title="อนุมัติ"><CheckCircle className="w-5 h-5" /></button>
                          <button onClick={() => updateStatus(leave.id, 'Rejected')} className="p-1.5 bg-rose-50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-lg" title="ไม่อนุมัติ"><XCircle className="w-5 h-5" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">ไม่มีรายการลางาน</p>
          )}
        </div>
      </div>
    </div>
  );
}