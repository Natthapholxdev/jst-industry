'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LeaveRequestForm({ employeeId }: { employeeId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'ลากิจ',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit leave request');
      alert('ส่งคำขอลางานเรียบร้อยแล้ว รอแอดมินอนุมัติครับ');
      setIsOpen(false);
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="px-6 py-3 bg-rose-50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold rounded-xl transition shadow-sm border border-rose-200">
        📝 ยื่นขอลางาน
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b bborder-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">แบบฟอร์มขอลางาน</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-rose-500 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">ประเภทการลา</label>
                <select value={formData.leave_type} onChange={e => setFormData({...formData, leave_type: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="ลากิจ">ลากิจ</option>
                  <option value="ลาป่วย">ลาป่วย</option>
                  <option value="พักร้อน">พักร้อน</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">ตั้งแต่วันที่</label>
                  <input required type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">ถึงวันที่</label>
                  <input required type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">เหตุผลการลา</label>
                <textarea required rows={3} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" placeholder="ระบุเหตุผล..."></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition">ยกเลิก</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white font-bold rounded-xl transition">{isSubmitting ? 'กำลังส่ง...' : 'ยืนยันการลา'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}