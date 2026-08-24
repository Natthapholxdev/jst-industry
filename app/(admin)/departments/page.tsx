'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import { Plus, Search, Eye, ClipboardList, Edit, User, Smartphone, Building2, FolderOpen, MapPin, AlertTriangle, Wallet, FileText, CheckCircle, Save, Phone, Circle, UserCircle2, Clock, CalendarOff, LayoutDashboard, Settings, LogOut, BarChart3, Sun, Moon, Monitor, Flame } from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    name_th: ''
  });

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          id, code, name_th,
          employees ( count )
        `)
        .order('code', { ascending: true });
        
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddNew = () => {
    setFormData({ id: '', code: '', name_th: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (dept: any) => {
    setFormData({
      id: dept.id,
      code: dept.code,
      name_th: dept.name_th
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name_th) {
      return Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'กรุณากรอกรหัสแผนก และ ชื่อแผนก' });
    }

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        name_th: formData.name_th
      };

      let res;
      if (isEditing) {
        res = await fetch('/api/departments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: formData.id })
        });
      } else {
        res = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: isEditing ? 'อัปเดตข้อมูลแผนกแล้ว' : 'เพิ่มแผนกใหม่เรียบร้อย', timer: 1500 });

      setIsModalOpen(false);
      fetchDepartments();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: error.message });
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto font-sans">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-cyan-600 transition">&larr;</Link>
            จัดการแผนก (Departments)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-10 font-medium">ตั้งค่าแผนกเพื่อใช้จัดกลุ่มพนักงาน และเป็นตัวนำหน้ารหัสบริษัท</p>
        </div>
        
        <button onClick={handleAddNew} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-2">
          <Plus className="w-5 h-5" /> เพิ่มแผนกใหม่
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border bborder-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400 font-medium">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-200">รหัสแผนก (Code)</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-200">ชื่อแผนก (ภาษาไทย)</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 dark:text-slate-200">จำนวนพนักงาน</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 dark:text-slate-200">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-800">
                {departments.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">ยังไม่มีข้อมูลแผนก</td></tr>
                ) : (
                  departments.map((dept) => {
                    const empCount = dept.employees?.[0]?.count || 0;
                    return (
                      <tr key={dept.id} className="hover:bg-slate-50 dark:bg-slate-900 transition">
                        <td className="px-6 py-4 font-black text-cyan-700 text-lg">{dept.code}</td>
                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 text-lg">{dept.name_th}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex px-3 py-1 rounded-full text-sm font-bold bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                            {empCount} คน
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleEdit(dept)} className="px-4 py-1.5 bg-white dark:bg-slate-800 border bborder-slate-200 dark:border-slate-700 hover:border-cyan-300 hover:bg-cyan-50 text-slate-600 dark:text-slate-300 hover:text-cyan-700 font-bold rounded-lg transition text-sm shadow-sm">
                            แก้ไข
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b bborder-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-cyan-800 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isEditing ? <><Edit className="w-5 h-5" /> แก้ไขข้อมูลแผนก</> : <><Plus className="w-5 h-5" /> เพิ่มแผนกใหม่</>}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">รหัสภาษาอังกฤษย่อ (Code) *</label>
                <input 
                  required type="text" placeholder="เช่น PROD, SALE, HR" 
                  value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  className="w-full px-4 py-2 border rounded-lg outline-none font-black text-cyan-700 bg-cyan-50 focus:ring-2 focus:ring-cyan-500 uppercase" 
                />
                <p className="text-xs text-slate-400 mt-1">ใช้เป็นตัวนำหน้ารหัสพนักงาน (เช่น PROD-001)</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">ชื่อแผนกภาษาไทย *</label>
                <input 
                  required type="text" placeholder="เช่น ฝ่ายผลิต, ฝ่ายขาย" 
                  value={formData.name_th} onChange={e => setFormData({...formData, name_th: e.target.value})} 
                  className="w-full px-4 py-2 border rounded-lg outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500" 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition shadow-md">
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}