'use client';
import { useRouter } from 'next/navigation';
import React from "react";
import Link from "next/link";

export default function EmployeeLayout({
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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B1120] font-sans transition-colors selection:bg-indigo-500/30">
      {/* 📱 Navbar พนักงาน */}
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-900 dark:to-slate-900 text-white flex justify-between items-center px-4 md:px-8 h-16 w-full shadow-md sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black shadow-inner">
            EMP
          </div>
          <span className="font-black text-xl tracking-tight hidden sm:block">
            Employee Portal
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/my-profile" className="px-3 py-1.5 rounded-lg text-indigo-50 hover:bg-white/10 font-bold transition">
            โปรไฟล์ของฉัน
          </Link>
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-500/20 font-bold transition">
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* 🚀 พื้นที่แสดงเนื้อหา */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8 text-slate-900 dark:text-slate-100 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}
