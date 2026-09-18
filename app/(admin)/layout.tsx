'use client';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ROUTES } from '@/lib/routes';
import { 
  LayoutDashboard, Clock, Users, Building2, CalendarOff, 
  FileText, BarChart3, Settings, LogOut, User,
  ChevronDown, ChevronRight, ChevronLeft, Menu, X, ShieldAlert,
  History, Wallet, BookOpen
} from 'lucide-react';

const MENU_GROUPS = [
  {
    title: "MAIN",
    items: [
      { name: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard, color: "indigo" },
    ]
  },
  {
    title: "TIME & ATTENDANCE",
    items: [
      { name: "จัดการเวลา (รายวัน)", href: "/attendance", icon: Clock, color: "emerald" },
      { name: "จัดการเวลา (รายบุคคล)", href: "/attendance-person", icon: User, color: "emerald" },
      { name: "อนุมัติการลา", href: "/leaves", icon: CalendarOff, color: "rose" },
    ]
  },
  {
    title: "HR & PAYROLL",
    items: [
      { name: "ข้อมูลพนักงาน", href: "/employees", icon: Users, color: "blue" },
      { name: "จัดการแผนก", href: "/departments", icon: Building2, color: "cyan" },
      { name: "สรุปค่าจ้างและโอที", href: "/ot-reports", icon: Wallet, color: "orange" },
    ]
  },
  {
    title: "SYSTEM SETTINGS",
    items: [
      { name: "ผู้ดูแลระบบ", href: "/admin-users", icon: ShieldAlert, color: "purple" },
      { name: "ประวัติการใช้งาน (Log)", href: "/admin-logs", icon: History, color: "slate" },
      { name: "คู่มือการใช้งาน", href: "/manual", icon: BookOpen, color: "indigo" },
      { name: "ตั้งค่าระบบ", href: "/settings", icon: Settings, color: "purple" },
    ]
  }
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(MENU_GROUPS.map(g => g.title)); // Open all by default

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await fetch(ROUTES.API.AUTH_LOGOUT, { method: 'POST' });
    localStorage.removeItem('userSession');
    router.push(ROUTES.LOGIN);
  };

  const toggleGroup = (title: string) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      setOpenGroups(prev => prev.includes(title) ? prev : [...prev, title]);
      return;
    }
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  const getThemeColorClass = (color: string, isActive: boolean) => {
    // Apple minimalist sidebar item
    if (isActive) {
      return `bg-black/5 dark:bg-white/10 text-[var(--apple-text-primary)] font-semibold shadow-sm`;
    }
    return `text-[var(--apple-text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--apple-text-primary)] font-medium`;
  };

  const getIconColorClass = (color: string, isActive: boolean) => {
    // Use Apple Blue for active icons, gray for inactive
    if (isActive) return "text-apple-blue bg-white dark:bg-black shadow-sm";
    return "text-[var(--apple-text-secondary)] bg-transparent group-hover:text-apple-blue";
  };

  const SidebarContent = ({ isMobile = false }) => {
    const collapsed = !isMobile && isSidebarCollapsed;
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-slate-200 dark:border-slate-800 transition-all duration-300">
        {/* โลโก้ */}
        <div className="h-16 md:h-20 flex items-center px-4 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-hidden">
          <div className="min-w-10 min-h-10 w-10 h-10 rounded-xl bg-apple-blue flex items-center justify-center text-white font-black shadow-sm">
            HR
          </div>
          {!collapsed && (
            <span className="ml-3 font-semibold text-lg text-[var(--apple-text-primary)] tracking-tight whitespace-nowrap animate-in fade-in duration-300">
              JST-INDUSTRY
            </span>
          )}
        </div>

        {/* เมนูนำทาง */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} py-4 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-300`}>
          {MENU_GROUPS.map((group, gIndex) => {
            const isOpen = openGroups.includes(group.title) || collapsed;
            return (
              <div key={gIndex} className="space-y-1">
                {/* Group Header */}
                {!collapsed ? (
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-2 py-2 text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {group.title}
                    {isOpen ? <ChevronDown className="w-4 h-4 opacity-70" /> : <ChevronRight className="w-4 h-4 opacity-70" />}
                  </button>
                ) : (
                  <div className="px-2 py-3 text-center">
                    <div className="h-[2px] w-8 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full" />
                  </div>
                )}

                {/* Items */}
                <div className={`space-y-1.5 overflow-hidden transition-all duration-300 origin-top ${isOpen ? "max-h-[500px] opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-0"}`}>
                  {group.items.map((item, iIndex) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link 
                        key={iIndex} 
                        href={item.href} 
                        title={collapsed ? item.name : undefined}
                        className={`group flex items-center ${collapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl transition-all duration-200 ${getThemeColorClass(item.color, isActive)}`}
                      >
                        <div className={`p-1.5 rounded-lg transition-colors ${!collapsed && 'mr-3'} shadow-sm ${getIconColorClass(item.color, isActive)}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ปุ่มออกจากระบบ */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button 
            onClick={handleLogout} 
            title={collapsed ? "ออกจากระบบ" : undefined}
            className={`group flex items-center justify-center w-full ${collapsed ? 'px-0' : 'px-4'} py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 shadow-sm font-bold`}
          >
            <LogOut className={`w-5 h-5 ${!collapsed && 'mr-2'} opacity-70 group-hover:opacity-100 transition-opacity`} />
            {!collapsed && "ออกจากระบบ"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0B1120] font-sans overflow-hidden text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-500/30">
      
      {/* 📱 แถบเมนูสำหรับมือถือ */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 h-16 w-full fixed top-0 z-50 shadow-sm transition-colors print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="w-8 h-8 bg-apple-blue rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            HR
          </div>
        </div>
      </header>

      {/* 📱 Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden transition-opacity print:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 📱 Mobile Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-white transform transition-transform duration-300 ease-in-out md:hidden print:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent isMobile={true} />
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </aside>

      {/* 💻 Sidebar ด้านซ้าย (Desktop) */}
      <aside className={`hidden md:flex flex-col z-20 relative shrink-0 transition-all duration-300 ease-in-out print:hidden ${isSidebarCollapsed ? 'w-[88px]' : 'w-[280px]'}`}>
        <SidebarContent isMobile={false} />
        
        {/* Toggle Collapse Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm z-30 transition-transform hover:scale-110 print:hidden"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* 🚀 พื้นที่สำหรับแสดงเนื้อหา */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-[#0B1120] pt-16 md:pt-0 scroll-smooth print:pt-0">
        <div className="max-w-[1600px] mx-auto min-h-full flex flex-col p-2 sm:p-4 md:p-6 lg:p-8 transition-all animate-in fade-in duration-500">
          {children}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.4);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.5);
        }
      `}</style>
    </div>
  );
}