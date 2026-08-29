'use client';

import React, { useEffect, useState } from 'react';
import { UserPlus, UserX, UserCog, Key } from 'lucide-react';
import Swal from 'sweetalert2';
import { logAdminAction } from '@/lib/auditLog';

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admins');
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error fetching admins:', error);
      Swal.fire({ icon: 'error', title: 'ดึงข้อมูลล้มเหลว', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({ icon: 'success', title: 'สำเร็จ', text: data.message, timer: 1500 });
        setIsModalOpen(false);
        setFormData({ username: '', password: '' });
        fetchAdmins();
        
        // Log action
        const sessionData = JSON.parse(localStorage.getItem('userSession') || '{}');
        const adminName = sessionData.name || 'System';
        logAdminAction(adminName, 'เพิ่มผู้ดูแลระบบใหม่', `เพิ่มบัญชี: ${formData.username}`);

      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'ล้มเหลว', text: error.message });
    }
  };

  const handleDelete = async (admin: any) => {
    const sessionData = JSON.parse(localStorage.getItem('userSession') || '{}');
    const currentUser = sessionData.name;

    if (admin.username === currentUser) {
      return Swal.fire({ icon: 'error', title: 'ไม่สามารถลบได้', text: 'คุณไม่สามารถลบบัญชีตัวเองขณะที่กำลังล็อกอินอยู่ได้' });
    }

    const result = await Swal.fire({
      title: 'ลบผู้ดูแลระบบ?',
      text: `คุณต้องการลบผู้ดูแลระบบ '${admin.username}' ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admins', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: admin.id }),
        });
        const data = await res.json();

        if (data.success) {
          Swal.fire('ลบสำเร็จ!', data.message, 'success');
          fetchAdmins();
          
          // Log action
          const adminName = sessionData.name || 'System';
          logAdminAction(adminName, 'ลบผู้ดูแลระบบ', `ลบบัญชี: ${admin.username}`);

        } else {
          throw new Error(data.error);
        }
      } catch (error: any) {
        Swal.fire('ผิดพลาด', error.message, 'error');
      }
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1000px] mx-auto font-sans text-slate-800 dark:text-slate-100">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <UserCog className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            จัดการบัญชีผู้ดูแลระบบ
          </h1>
          <p className="text-slate-500 mt-1 font-medium">จัดการบัญชีการเข้าถึงระบบหลังบ้านทั้งหมด</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> เพิ่มผู้ดูแลระบบ
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 font-medium">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300">ชื่อผู้ใช้ (Username)</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 dark:text-slate-300">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4 font-medium text-slate-500">{admin.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                        <UserCog className="w-4 h-4" /> {admin.username}
                        {admin.username === 'admin' && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-bold">Main Admin</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDelete(admin)} 
                        disabled={admin.username === 'admin'}
                        className={`px-3 py-1.5 font-bold rounded-lg transition text-sm shadow-sm flex items-center gap-1 mx-auto ${admin.username === 'admin' ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'}`}
                      >
                        <UserX className="w-4 h-4" /> ลบสิทธิ์
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> เพิ่มผู้ดูแลระบบใหม่
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white font-bold text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <UserCog className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น hr_admin"
                      value={formData.username} 
                      onChange={e => setFormData({...formData, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '')})} 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">ใช้ภาษาอังกฤษ ตัวเลข และ _ เท่านั้น</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">รหัสผ่าน (Password) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Key className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                    <input 
                      type="password" 
                      required
                      placeholder="ตั้งรหัสผ่าน"
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition">
                  เพิ่มบัญชี
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
