'use client';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect } from "react";
import Link from "next/link";
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
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('userSession');
    router.push('/login');
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
    const themes: Record<string, { active: string; inactive: string; hover: string; icon: string }> = {
      indigo: { 
        active: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30', 
        inactive: 'text-slate-600 dark:text-slate-300 border-transparent',
        hover: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-400',
        icon: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
      },
      emerald: {
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
        inactive: 'text-slate-600 dark:text-slate-300 border-transparent',
        hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400',
        icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
      },
      rose: {
        active: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
        inactive: 'text-slate-600 dark:text-slate-300 border-transparent',
        hover: 'hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-400',
        icon: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
      },
      blue: {
        active: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
        inactive: 'text-slate-600 dark:text-slate-300 border-transparent',
        hover: 'hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400',
        icon: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
      },
      cyan: {
        active: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30',
        inactive: 'text-slate-600 dark:text-slate-300 border-transparent',
        hover: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-700 dark:hover:text-cyan-400',
        icon: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400'
      },
      orange: {
        active: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-500/30',
        inactive: 'text-slate-600 dark:text-slate-300 border-transparent',
        hover: 'hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-400',
        icon: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
      },
      purple: {
        active: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
        inactive: 'text-slate-600 dark:text-slate-300 border-transparent',
        hover: 'hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-400',
        icon: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
      },
      slate: {
        active: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
        inactive: 'text-slate-600 dark:text-slate-300 border-transparent',
        hover: 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200',
        icon: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
      }
    };

    const t = themes[color] || themes.indigo;
    
    if (isActive) return `${t.active} border font-extrabold shadow-sm`;
    return `${t.inactive} ${t.hover} border font-bold`;
  };

  const getIconColorClass = (color: string, isActive: boolean) => {
    if (isActive) return "bg-white/50 dark:bg-black/20 text-current";
    return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-current group-hover:bg-white/50 dark:group-hover:bg-black/20";
  };

  const SidebarContent = ({ isMobile = false }) => {
    const collapsed = !isMobile && isSidebarCollapsed;
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-slate-200 dark:border-slate-800 transition-all duration-300">
        {/* โลโก้ */}
        <div className="h-16 md:h-20 flex items-center px-4 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-hidden">
          <div className="min-w-10 min-h-10 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30">
            HR
          </div>
          {!collapsed && (
            <span className="ml-3 font-black text-xl text-slate-800 dark:text-white tracking-tight whitespace-nowrap animate-in fade-in duration-300">
              TimeManage
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
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 h-16 w-full fixed top-0 z-50 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            HR
          </div>
        </div>
      </header>

      {/* 📱 Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 📱 Mobile Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent isMobile={true} />
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </aside>

      {/* 💻 Sidebar ด้านซ้าย (Desktop) */}
      <aside className={`hidden md:flex flex-col z-20 relative shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-[88px]' : 'w-[280px]'}`}>
        <SidebarContent isMobile={false} />
        
        {/* Toggle Collapse Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm z-30 transition-transform hover:scale-110"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* 🚀 พื้นที่สำหรับแสดงเนื้อหา */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-[#0B1120] pt-16 md:pt-0 scroll-smooth">
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