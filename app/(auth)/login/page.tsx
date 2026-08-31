'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Building2, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-delayed { animation: float 5s ease-in-out infinite; animation-delay: 2s; }
        
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }

        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}} />

      {/* Left side: Branding / Enterprise feel */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-slate-900 text-white flex-col justify-between p-12 relative">
        {/* Background graphic effect */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none transition-transform duration-1000 hover:scale-110" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 100% 0%, #6366f1 0%, transparent 40%), radial-gradient(circle at 0% 100%, #3b82f6 0%, transparent 40%)' 
          }}
        ></div>
        
        {/* Floating Glass Widgets (The "ลูกเล่น") */}
        <div className="absolute right-12 top-1/4 animate-float z-20">
          <div className="px-5 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-slate-300">สถานะระบบ</div>
                <div className="text-sm font-bold text-white">ออนไลน์ 100%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-3/4 bottom-1/3 animate-float-delayed z-20 opacity-80 scale-90">
          <div className="px-4 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Payroll & OT</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-1000">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight uppercase">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-gradient-x">JST-INDUSTRY</span>
          </span>
        </div>

        {/* Center message */}
        <div className="relative z-10 max-w-lg animate-in fade-in slide-in-from-left-8 duration-1000 delay-150">
          <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
            ยกระดับการบริหารทรัพยากรบุคคลขององค์กร
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            เข้าสู่ระบบเพื่อจัดการเวลาทำงาน อนุมัติการลา และสรุปรายงานค่าจ้างได้อย่างรวดเร็ว แม่นยำ และปลอดภัยสูงสุด
          </p>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4 text-slate-300 font-medium hover:text-white transition-colors cursor-default">
              <div className="p-1.5 bg-slate-800 rounded-lg shadow-inner"><ShieldCheck className="w-5 h-5 text-indigo-400" /></div>
              ระบบรักษาความปลอดภัยมาตรฐานสากล
            </div>
            <div className="flex items-center gap-4 text-slate-300 font-medium hover:text-white transition-colors cursor-default">
              <div className="p-1.5 bg-slate-800 rounded-lg shadow-inner"><ShieldCheck className="w-5 h-5 text-indigo-400" /></div>
              ประมวลผลข้อมูลแม่นยำ ป้องกันข้อผิดพลาด
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 text-slate-500 text-sm font-medium animate-in fade-in duration-1000 delay-300">
          &copy; {new Date().getFullYear()} JST Industry Co., Ltd. All rights reserved.
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center p-8 sm:p-12 relative bg-white dark:bg-slate-900 overflow-hidden">
        
        {/* Mobile Background Blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 md:hidden"></div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
          
          <div className="mb-12 md:hidden flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">JST-INDUSTRY</span>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">เข้าสู่ระบบ (Back Office)</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">กรุณากรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าใช้งานระบบจัดการ</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">ชื่อผู้ใช้ (Username)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  placeholder="admin" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg placeholder:font-medium placeholder:text-slate-400 shadow-sm"
                  required 
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">รหัสผ่าน (Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-400 shadow-sm"
                  required 
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className={`group relative w-full flex justify-center items-center gap-2 py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-indigo-600/20 overflow-hidden transition-all bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer"></div>
                
                {isLoading ? (
                  <>
                   <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   <span className="relative z-10">กำลังตรวจสอบ...</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">เข้าสู่ระบบ</span> 
                    <ArrowRight className="w-5 h-5 ml-1 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
    </div>
  );
}