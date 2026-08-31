import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function ShiftManager() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name_th: '', time_in: '08:00', time_out: '17:00', ot_start_time: '18:30' });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    const res = await fetch('/api/shifts');
    const data = await res.json();
    if (data.success) setShifts(data.data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const payload = editingId ? { id: editingId, ...formData } : formData;

    const res = await fetch('/api/shifts', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingId(null);
      fetchShifts();
    } else {
      alert('Failed to save shift');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบกะนี้? พนักงานที่อยู่ในกะนี้อาจได้รับผลกระทบ')) return;
    const res = await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchShifts();
  };

  return (
    <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">ระบบกะการทำงาน (Shift Management)</h2>
        <button 
          onClick={() => { setEditingId(null); setFormData({ name_th: '', time_in: '08:00', time_out: '17:00', ot_start_time: '18:30' }); setIsModalOpen(true); }}
          className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> เพิ่มกะ
        </button>
      </div>

      <div className="p-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400">ชื่อกะ</th>
              <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400">เวลาเข้า</th>
              <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400">เวลาออก</th>
              <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400">เวลาเริ่ม OT</th>
              <th className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {shifts.map(s => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium dark:text-white">{s.name_th}</td>
                <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">{s.time_in}</td>
                <td className="px-4 py-3 font-medium text-rose-600 dark:text-rose-400">{s.time_out}</td>
                <td className="px-4 py-3 font-medium text-orange-600">{s.ot_start_time}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditingId(s.id); setFormData({ name_th: s.name_th, time_in: s.time_in, time_out: s.time_out, ot_start_time: s.ot_start_time }); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-2"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4 dark:text-white">{editingId ? 'แก้ไขกะการทำงาน' : 'เพิ่มกะการทำงาน'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="block text-sm font-bold mb-1 dark:text-slate-300">ชื่อกะ</label><input required type="text" value={formData.name_th} onChange={e => setFormData({...formData, name_th: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-slate-300">เวลาเข้า (24 ชม.)</label>
                  <input required type="text" maxLength={5} placeholder="08:00" value={formData.time_in} onChange={e => {
                    let val = e.target.value.replace(/[^0-9:]/g, '');
                    if (val.length === 2 && !val.includes(':') && e.target.value.length === 2) val += ':';
                    setFormData({...formData, time_in: val});
                  }} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white tracking-widest text-center font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-slate-300">เวลาออก (24 ชม.)</label>
                  <input required type="text" maxLength={5} placeholder="17:00" value={formData.time_out} onChange={e => {
                    let val = e.target.value.replace(/[^0-9:]/g, '');
                    if (val.length === 2 && !val.includes(':') && e.target.value.length === 2) val += ':';
                    setFormData({...formData, time_out: val});
                  }} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white tracking-widest text-center font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">เวลาเริ่ม OT (24 ชม.)</label>
                <input required type="text" maxLength={5} placeholder="18:30" value={formData.ot_start_time} onChange={e => {
                  let val = e.target.value.replace(/[^0-9:]/g, '');
                  if (val.length === 2 && !val.includes(':') && e.target.value.length === 2) val += ':';
                  setFormData({...formData, ot_start_time: val});
                }} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white tracking-widest text-center font-bold" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold dark:text-white">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-bold">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
