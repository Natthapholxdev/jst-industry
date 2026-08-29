'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = { type: 'admin', username: username.trim(), password: password.trim() };

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');

      localStorage.setItem('userSession', JSON.stringify({ role: data.role, id: data.data.id, name: data.data.username }));
      
      Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ', timer: 1500, showConfirmButton: false });
      
      router.push('/dashboard');
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'เข้าสู่ระบบไม่สำเร็จ', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700/50">
        
        {/* Header สวยๆ */}
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg mb-4">
            🏢
          </div>
          <h1 className="text-2xl font-black text-white">Back Office</h1>
          <p className="text-slate-400 mt-1 font-medium text-sm">ระบบจัดการข้อมูลสำหรับผู้ดูแลระบบ</p>
        </div>

        {/* Form Area */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5 animate-fadeIn">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Username (ชื่อผู้ใช้)</label>
              <input 
                type="text" 
                placeholder="กรอกชื่อผู้ใช้..." 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-slate-800 transition text-center text-lg"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Password (รหัสผ่าน)</label>
              <input 
                type="password" 
                placeholder="กรอกรหัสผ่าน..." 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-slate-800 transition text-center text-lg"
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-3.5 mt-4 rounded-xl text-white font-bold text-lg shadow-md transition bg-slate-800 hover:bg-slate-900 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบจัดการ'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}