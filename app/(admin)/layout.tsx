'use client';
import { useRouter } from 'next/navigation';
import React from "react";
import Link from "next/link";
import { LayoutDashboard, Clock, Users, Building2, CalendarOff, FileText, BarChart3, Settings, LogOut } from 'lucide-react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('userSession');
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* 📱 แถบเมนูสำหรับมือถือ */}
      <header className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center px-4 h-16 w-full fixed top-0 z-50 shadow-sm transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            HR
          </div>
          <span className="font-extrabold text-lg text-slate-800 dark:text-white">
            TimeManage
          </span>
        </div>
        <button onClick={handleLogout} className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 text-sm font-bold bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-lg transition">
          ออก
        </button>
      </header>

      {/* 💻 Sidebar ด้านซ้าย */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 relative transition-colors">
        
        {/* โลโก้ */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black shadow-md">
            HR
          </div>
          <span className="ml-3 font-black text-xl text-slate-800 dark:text-white tracking-tight">
            TimeManage
          </span>
        </div>

        {/* เมนูนำทาง */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          
          <div className="px-4 pb-2 text-xs font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider">เมนูหลัก (MAIN)</div>

          <Link href="/dashboard" className="group flex items-center px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 transition-all duration-200 font-bold border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            </div>
            ภาพรวม
          </Link>

          <Link href="/attendance" className="group flex items-center px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/10 transition-all duration-200 font-bold border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            จัดการเวลา
          </Link>

          <Link href="/employees" className="group flex items-center px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-500/10 transition-all duration-200 font-bold border border-transparent hover:border-blue-100 dark:hover:border-blue-500/20">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            พนักงาน
          </Link>

          <Link href="/departments" className="group flex items-center px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50/80 dark:hover:bg-cyan-500/10 transition-all duration-200 font-bold border border-transparent hover:border-cyan-100 dark:hover:border-cyan-500/20">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-500/20 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            จัดการแผนก
          </Link>

          <Link href="/leaves" className="group flex items-center px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-500/10 transition-all duration-200 font-bold border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            </div>
            อนุมัติการลา
          </Link>

          <div className="px-4 pb-2 pt-6 text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider">รายงานและระบบ (SYSTEM)</div>

          <Link href="/admin-users" className="group flex items-center px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 transition-all duration-200 font-bold border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            จัดการผู้ดูแลระบบ
          </Link>

          <Link href="/admin-logs" className="group flex items-center px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/10 transition-all duration-200 font-bold border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            ประวัติใช้งาน (Log)
          </Link>


          <Link href="/ot-reports" className="group flex items-center px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-orange-700 dark:hover:text-orange-400 hover:bg-orange-50/80 dark:hover:bg-orange-500/10 transition-all duration-200 font-bold border border-transparent hover:border-orange-100 dark:hover:border-orange-500/20">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            รายงานสรุปโอที
          </Link>

          <Link href="/settings" className="group flex items-center px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50/80 dark:hover:bg-purple-500/10 transition-all duration-200 font-bold border border-transparent hover:border-purple-100 dark:hover:border-purple-500/20">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            ตั้งค่าระบบ
          </Link>
        </nav>

        {/* ปุ่มออกจากระบบ */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/50">
          <button onClick={handleLogout} className="group flex items-center justify-center w-full px-4 py-3.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 shadow-sm font-bold">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* 🚀 พื้นที่สำหรับแสดงเนื้อหา */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 pt-16 md:pt-0 transition-colors">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}