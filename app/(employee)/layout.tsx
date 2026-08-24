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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors">
      {/* 📱 Navbar พนักงาน */}
      <header className="bg-indigo-600 dark:bg-indigo-900 text-white flex justify-between items-center px-6 h-16 w-full shadow-sm sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lg tracking-wide">
            Employee Portal
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/my-profile" className="text-indigo-100 hover:text-white font-medium transition">
            โปรไฟล์ของฉัน
          </Link>
          <button onClick={handleLogout} className="text-rose-200 hover:text-white font-bold transition">
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* 🚀 พื้นที่แสดงเนื้อหา */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100">
        {children}
      </main>
    </div>
  );
}
