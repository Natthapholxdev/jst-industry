'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, CheckCircle, XCircle, Clock, Plus, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '@/lib/supabase';

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'ลาป่วย',
    start_date: '',
    end_date: '',
    reason: ''
  });

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

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('id, emp_code, full_name').eq('status', 'Active').order('emp_code');
    if (data) setEmployees(data);
  };

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
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

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.start_date || !formData.end_date) {
      return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // แอดมินบันทึกเอง ให้อนุมัติอัตโนมัติเลย
        body: JSON.stringify({ ...formData, status: 'Approved' }) 
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Swal.fire({ icon: 'success', title: 'บันทึกการลาสำเร็จ', timer: 1500, showConfirmButton: false });
      setShowAddModal(false);
      setFormData({ employee_id: '', leave_type: 'ลาป่วย', start_date: '', end_date: '', reason: '' });
      fetchLeaves();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto font-sans">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition">&larr;</Link>
            ระบบจัดการการลางาน
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-10 font-medium">บันทึก อนุมัติ หรือปฏิเสธคำขอการลางานของพนักงาน</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm"
        >
          <Plus className="w-5 h-5" /> บันทึกการลาใหม่
        </button>
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

      {/* 🌟 Add Leave Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" /> บันทึกการลางาน
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmitLeave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">พนักงาน</label>
                <select 
                  required
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- เลือกพนักงาน --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>[{emp.emp_code}] {emp.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">ประเภทการลา</label>
                <select 
                  value={formData.leave_type}
                  onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="ลาป่วย">ลาป่วย</option>
                  <option value="ลากิจ">ลากิจ</option>
                  <option value="ลาพักร้อน">ลาพักร้อน</option>
                  <option value="ลาคลอด">ลาคลอด</option>
                  <option value="ขาดงาน">ขาดงาน (ไม่มีเหตุผล)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">วันเริ่มต้น</label>
                  <input 
                    type="date" required
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">วันสิ้นสุด</label>
                  <input 
                    type="date" required
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">เหตุผล (ถ้ามี)</label>
                <textarea 
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="ระบุเหตุผลการลา..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
                  ยกเลิก
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50">
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล (อนุมัติทันที)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}