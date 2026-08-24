'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const router = useRouter();
  
  // สถานะเลือกว่ากำลังล็อกอินในฐานะใคร ('employee' หรือ 'admin')
  const [loginType, setLoginType] = useState<'employee' | 'admin'>('employee');
  const [isLoading, setIsLoading] = useState(false);

  // ฟอร์มพนักงาน
  const [nationalId, setNationalId] = useState('');

  // ฟอร์มแอดมิน
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = loginType === 'employee' 
        ? { type: 'employee', username: nationalId.trim(), empCode: username.trim() } 
        : { type: 'admin', username: username.trim(), password: password.trim() };

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');

      // Save for UI rendering if needed (but true auth is in HTTP-only cookie now)
      localStorage.setItem('userSession', JSON.stringify({ role: data.role, id: data.data.id, name: data.data.full_name || data.data.username }));
      
      Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ', timer: 1500, showConfirmButton: false });
      
      if (data.role === 'employee') {
        router.push('/my-profile');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'เข้าสู่ระบบไม่สำเร็จ', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border bborder-slate-100 dark:border-slate-700/50">
        
        {/* Header สวยๆ */}
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg mb-4">
            🏢
          </div>
          <h1 className="text-2xl font-black text-white">HR Management</h1>
          <p className="text-slate-400 mt-1 font-medium text-sm">ระบบจัดการทรัพยากรบุคคล</p>
        </div>

        {/* Tab เลือกประเภทการล็อกอิน */}
        <div className="flex border-b bborder-slate-100 dark:border-slate-700/50">
          <button 
            type="button"
            onClick={() => setLoginType('employee')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${loginType === 'employee' ? 'bg-indigo-50 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900'}`}
          >
            👤 เข้าสู่ระบบพนักงาน
          </button>
          <button 
            type="button"
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${loginType === 'admin' ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border-b-2 border-slate-800' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900'}`}
          >
            🛠️ ผู้ดูแลระบบ
          </button>
        </div>

        {/* Form Area */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5 animate-fadeIn">
            
            {loginType === 'employee' ? (
              // ฟอร์มพนักงาน
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">เลขประจำตัวประชาชน (13 หลัก)</label>
                  <input 
                    type="text" 
                    maxLength={13}
                    placeholder="กรอกเลขบัตรประชาชนของคุณ..." 
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.replace(/[^0-9]/g, ''))} // บังคับกรอกแต่ตัวเลข
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border bborder-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 transition tracking-widest text-center text-lg"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">รหัสพนักงาน</label>
                  <input 
                    type="text" 
                    placeholder="เช่น EMP001" 
                    value={username} // Reusing username state for empCode
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border bborder-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 transition text-center text-lg uppercase"
                    required 
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">ใช้เลขบัตรประชาชนและรหัสพนักงานเพื่อเข้าสู่ระบบ</p>
              </div>
            ) : (
              // ฟอร์มแอดมิน
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Username</label>
                  <input 
                    type="text" 
                    placeholder="ชื่อผู้ใช้" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border bborder-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-slate-800 transition"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Password</label>
                  <input 
                    type="password" 
                    placeholder="รหัสผ่าน" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border bborder-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-slate-800 transition"
                    required 
                  />
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-lg shadow-md transition ${loginType === 'employee' ? 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700' : 'bg-slate-800 hover:bg-slate-900'} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}