'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Users,
  UserCheck,
  Network,
  LayoutGrid,
  Phone,
  Download,
  ChevronDown,
  X,
  User,
  Loader2,
  Search,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/routes';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Department {
  id: string;
  name_th: string;
  code: string;
}

interface Employee {
  id: string;
  emp_code: string;
  full_name: string;
  position: string | null;
  department: string | null;
  department_id: string | null;
  status: string;
  phone: string | null;
}

interface GroupedDept {
  dept: Department | null;
  deptName: string;
  employees: Employee[];
}

// ─── Palette for department header cards ─────────────────────────────────────

const DEPT_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-400' },
  { bg: 'bg-violet-500', light: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-400' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-400' },
  { bg: 'bg-rose-500', light: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-400' },
  { bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-400' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-400' },
  { bg: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-400' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-400' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Employee Card (used in both views) ──────────────────────────────────────

function EmployeeCard({
  emp,
  colorIdx,
  onClick,
}: {
  emp: Employee;
  colorIdx: number;
  onClick: (emp: Employee) => void;
}) {
  const color = DEPT_COLORS[colorIdx % DEPT_COLORS.length];
  const isActive = emp.status === 'Active';

  return (
    <button
      onClick={() => onClick(emp)}
      className={`group w-full text-left bg-white dark:bg-black/30 border ${color.border} rounded-2xl p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3`}
    >
      {/* Avatar */}
      <div className={`${color.bg} shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm`}>
        {getInitials(emp.full_name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[var(--apple-text-primary)] text-sm truncate">{emp.full_name}</div>
        <div className="text-xs text-[var(--apple-text-secondary)] font-medium truncate">
          {emp.emp_code} {emp.position ? `· ${emp.position}` : ''}
        </div>
      </div>

      {/* Status dot */}
      <span
        title={isActive ? 'ทำงานอยู่' : 'พ้นสภาพ'}
        className={`shrink-0 w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
      />
    </button>
  );
}

// ─── Department Node (Tree view parent) ──────────────────────────────────────

function DeptNode({
  group,
  colorIdx,
  onEmpClick,
}: {
  group: GroupedDept;
  colorIdx: number;
  onEmpClick: (emp: Employee) => void;
}) {
  const color = DEPT_COLORS[colorIdx % DEPT_COLORS.length];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col items-center">
      {/* Dept header card */}
      <div className={`${color.bg} text-white rounded-2xl px-5 py-3 shadow-md flex items-center gap-3 min-w-[180px] max-w-[240px] w-full cursor-pointer select-none`}
        onClick={() => setCollapsed(c => !c)}>
        <Building2 className="w-5 h-5 shrink-0 opacity-90" />
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-sm truncate">{group.deptName}</div>
          <div className="text-xs opacity-80 font-medium">{group.employees.length} คน</div>
        </div>
        <ChevronDown className={`w-4 h-4 opacity-80 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
      </div>

      {/* Connector + children */}
      {!collapsed && group.employees.length > 0 && (
        <div className="flex flex-col items-center mt-0">
          {/* Vertical stem */}
          <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-600" />

          {/* Horizontal bar */}
          {group.employees.length > 1 && (
            <div className="relative flex items-start">
              <div
                className="absolute top-0 left-0 right-0 h-0.5 bg-slate-300 dark:bg-slate-600"
                style={{ left: '50%', transform: 'translateX(-50%)', width: `calc(100% - 64px)` }}
              />
            </div>
          )}

          {/* Employee cards row */}
          <div className="flex gap-3 items-start flex-wrap justify-center pt-0">
            {group.employees.map((emp, i) => (
              <div key={emp.id} className="flex flex-col items-center">
                {/* Stem to each card */}
                <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-600" />
                <div className="w-[180px]">
                  <EmployeeCard emp={emp} colorIdx={colorIdx} onClick={onEmpClick} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!collapsed && group.employees.length === 0 && (
        <div className="flex flex-col items-center mt-0">
          <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-600" />
          <div className={`text-xs ${color.text} ${color.light} border ${color.border} rounded-xl px-4 py-2 font-medium`}>
            ยังไม่มีพนักงาน
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Grid View Department Card ────────────────────────────────────────────────

function DeptGridCard({
  group,
  colorIdx,
  onEmpClick,
}: {
  group: GroupedDept;
  colorIdx: number;
  onEmpClick: (emp: Employee) => void;
}) {
  const color = DEPT_COLORS[colorIdx % DEPT_COLORS.length];
  const activeCount = group.employees.filter(e => e.status === 'Active').length;

  return (
    <div className={`bg-white dark:bg-black/20 rounded-[24px] border ${color.border} shadow-[var(--shadow-apple-soft)] overflow-hidden`}>
      {/* Header */}
      <div className={`${color.bg} px-5 py-4 flex items-center gap-3`}>
        <div className="p-2 bg-white/20 rounded-xl">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-white text-base truncate">{group.deptName}</h3>
          <p className="text-xs text-white/80 font-medium">
            {activeCount} คนทำงานอยู่ · รวม {group.employees.length} คน
          </p>
        </div>
        <span className="shrink-0 bg-white/20 text-white text-xs font-extrabold px-3 py-1 rounded-full">
          {group.employees.length}
        </span>
      </div>

      {/* Employee list */}
      <div className="p-4 space-y-2">
        {group.employees.length === 0 ? (
          <p className="text-center text-sm text-[var(--apple-text-secondary)] py-4">ยังไม่มีพนักงาน</p>
        ) : (
          group.employees.map(emp => (
            <EmployeeCard key={emp.id} emp={emp} colorIdx={colorIdx} onClick={onEmpClick} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Employee Detail Modal ────────────────────────────────────────────────────

function EmployeeModal({
  emp,
  deptName,
  colorIdx,
  onClose,
}: {
  emp: Employee;
  deptName: string;
  colorIdx: number;
  onClose: () => void;
}) {
  const color = DEPT_COLORS[colorIdx % DEPT_COLORS.length];
  const isActive = emp.status === 'Active';

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header strip */}
        <div className={`${color.bg} px-6 py-5 flex items-start justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-extrabold text-2xl shadow-inner">
              {getInitials(emp.full_name)}
            </div>
            <div>
              <h2 className="text-white font-extrabold text-lg leading-tight">{emp.full_name}</h2>
              <p className="text-white/80 text-sm font-medium mt-0.5">{emp.position || 'ไม่ระบุตำแหน่ง'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <InfoRow icon={<User className="w-4 h-4" />} label="รหัสพนักงาน" value={emp.emp_code} />
          <InfoRow icon={<Building2 className="w-4 h-4" />} label="แผนก" value={deptName} />
          <InfoRow icon={<Phone className="w-4 h-4" />} label="เบอร์โทร" value={emp.phone || '-'} />
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[var(--apple-text-secondary)] shrink-0">
              {isActive ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-400" />}
            </span>
            <div>
              <p className="text-xs font-medium text-[var(--apple-text-secondary)]">สถานะ</p>
              <span className={`text-sm font-extrabold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                {isActive ? 'ทำงานอยู่' : 'พ้นสภาพ / ลาออก'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--apple-text-primary)] font-bold rounded-2xl transition text-sm">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[var(--apple-text-secondary)] shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-xs font-medium text-[var(--apple-text-secondary)]">{label}</p>
        <p className="text-sm font-bold text-[var(--apple-text-primary)]">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrgChartPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [filterDeptId, setFilterDeptId] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);

  // ── Fetch data ────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [{ data: depts }, { data: emps }] = await Promise.all([
          supabase.from('departments').select('id, name_th, code').order('code'),
          supabase.from('employees').select('id, emp_code, full_name, position, department, status, phone, department_id').order('emp_code'),
        ]);
        setDepartments(depts || []);
        setEmployees(emps || []);
      } catch (err) {
        console.error('OrgChart fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.status === 'Active').length,
    depts: departments.length,
  }), [employees, departments]);

  // ── Grouping logic ────────────────────────────────────────────────────────

  const grouped = useMemo((): GroupedDept[] => {
    // apply search filter
    const filtered = employees.filter(emp => {
      const matchDept = filterDeptId === 'All' || emp.department_id === filterDeptId;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q
        || emp.full_name?.toLowerCase().includes(q)
        || emp.emp_code?.toLowerCase().includes(q)
        || emp.position?.toLowerCase().includes(q);
      return matchDept && matchSearch;
    });

    // build dept groups in dept order
    const groups: GroupedDept[] = departments.map(dept => ({
      dept,
      deptName: dept.name_th,
      employees: filtered.filter(e => e.department_id === dept.id),
    }));

    // add employees with no matching dept
    const unmapped = filtered.filter(e => !departments.some(d => d.id === e.department_id));
    if (unmapped.length > 0) {
      groups.push({ dept: null, deptName: 'ไม่ระบุแผนก', employees: unmapped });
    }

    // filter to only non-empty when a dept is selected
    if (filterDeptId !== 'All') {
      return groups.filter(g => g.employees.length > 0);
    }

    return groups;
  }, [employees, departments, filterDeptId, searchQuery]);

  // ── Export handler ────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    // Fallback to print since html2canvas is not installed
    window.print();
  }, []);

  // ── Dept color index lookup ───────────────────────────────────────────────

  const deptColorMap = useMemo(() => {
    const map = new Map<string, number>();
    departments.forEach((d, i) => map.set(d.id, i));
    return map;
  }, [departments]);

  const getColorIdx = (group: GroupedDept) =>
    group.dept ? (deptColorMap.get(group.dept.id) ?? 0) : DEPT_COLORS.length - 1;

  const selectedEmpDeptName = useMemo(() => {
    if (!selectedEmp) return '';
    const dept = departments.find(d => d.id === selectedEmp.department_id);
    return dept?.name_th || selectedEmp.department || 'ไม่ระบุแผนก';
  }, [selectedEmp, departments]);

  const selectedEmpColorIdx = useMemo(() => {
    if (!selectedEmp?.department_id) return 0;
    return deptColorMap.get(selectedEmp.department_id) ?? 0;
  }, [selectedEmp, deptColorMap]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto min-h-screen animate-in fade-in duration-500 print:p-2">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--apple-text-primary)] flex items-center gap-3">
            <Link href={ROUTES.DASHBOARD} className="text-[var(--apple-text-secondary)] hover:text-apple-blue transition">
              <ArrowLeft className="w-7 h-7" />
            </Link>
            โครงสร้างองค์กร (Org Chart)
          </h1>
          <p className="text-[var(--apple-text-secondary)] mt-1 ml-10 font-medium">
            แผนภูมิลำดับชั้น และโครงสร้างแผนกพนักงานทั้งหมด
          </p>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          className="px-5 py-2.5 bg-apple-blue hover:opacity-90 text-white font-bold rounded-[980px] shadow-sm transition flex items-center gap-2 shrink-0 print:hidden"
        >
          <Download className="w-4 h-4" />
          Export PNG
        </button>
      </div>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Users className="w-5 h-5 text-apple-blue" />}
          bg="bg-blue-50 dark:bg-blue-900/20"
          label="พนักงานทั้งหมด"
          value={stats.total}
          unit="คน"
        />
        <StatCard
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          bg="bg-emerald-50 dark:bg-emerald-900/20"
          label="ทำงานอยู่"
          value={stats.active}
          unit="คน"
        />
        <StatCard
          icon={<Building2 className="w-5 h-5 text-violet-600" />}
          bg="bg-violet-50 dark:bg-violet-900/20"
          label="จำนวนแผนก"
          value={stats.depts}
          unit="แผนก"
        />
      </div>

      {/* ── Controls Bar ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-black/20 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-[var(--shadow-apple-soft)] p-4 mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center print:hidden">

        {/* View toggle */}
        <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-[980px] shrink-0">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-4 py-2 rounded-[980px] text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              viewMode === 'tree'
                ? 'bg-white dark:bg-black text-[var(--apple-text-primary)] shadow-sm'
                : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]'
            }`}
          >
            <Network className="w-4 h-4" />
            แบบต้นไม้ (Tree)
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-[980px] text-sm font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-black text-[var(--apple-text-primary)] shadow-sm'
                : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            แบบตาราง (Grid by Dept)
          </button>
        </div>

        {/* Dept filter */}
        <div className="flex items-center gap-2 flex-1">
          <Building2 className="w-4 h-4 text-[var(--apple-text-secondary)] shrink-0" />
          <select
            value={filterDeptId}
            onChange={e => setFilterDeptId(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[var(--apple-text-primary)] font-bold rounded-[980px] outline-none focus:ring-2 focus:ring-apple-blue cursor-pointer text-sm transition"
          >
            <option value="All">ทุกแผนก</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name_th}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 relative">
          <Search className="w-4 h-4 text-[var(--apple-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[var(--apple-text-primary)] rounded-[980px] outline-none font-medium transition focus:ring-2 focus:ring-apple-blue text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-[var(--apple-text-secondary)]">
          <Loader2 className="w-10 h-10 animate-spin text-apple-blue mb-4" />
          <p className="font-medium">กำลังโหลดโครงสร้างองค์กร...</p>
        </div>
      ) : (
        <div ref={chartRef}>

          {/* ── TREE VIEW ──────────────────────────────────────────────── */}
          {viewMode === 'tree' && (
            <div className="animate-in fade-in duration-300">
              {/* Company root node */}
              <div className="flex flex-col items-center mb-0">
                <div className="bg-slate-800 dark:bg-slate-900 text-white rounded-2xl px-8 py-4 shadow-lg flex items-center gap-3 min-w-[220px]">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-extrabold text-base">บริษัท จ.ส.ท. อินดัสทรี</div>
                    <div className="text-xs text-white/70 font-medium">พนักงานรวม {stats.total} คน · {stats.depts} แผนก</div>
                  </div>
                </div>
                {/* Root stem */}
                <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600" />
                {/* Horizontal bar connecting all dept nodes */}
                <div className="w-full relative flex justify-center">
                  <div className="absolute top-0 left-[5%] right-[5%] h-0.5 bg-slate-300 dark:bg-slate-600" />
                </div>
              </div>

              {/* Dept nodes */}
              <div className="overflow-x-auto pb-6">
                <div className="flex gap-8 items-start justify-start min-w-max px-4 pt-0">
                  {grouped.map((group, i) => (
                    <div key={group.dept?.id ?? 'unmapped'} className="flex flex-col items-center">
                      {/* Stem from horizontal bar to dept card */}
                      <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600" />
                      <DeptNode
                        group={group}
                        colorIdx={getColorIdx(group)}
                        onEmpClick={setSelectedEmp}
                      />
                    </div>
                  ))}
                  {grouped.length === 0 && (
                    <div className="text-[var(--apple-text-secondary)] font-medium text-sm py-16 px-8">
                      ไม่พบข้อมูลที่ตรงกัน
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── GRID VIEW ──────────────────────────────────────────────── */}
          {viewMode === 'grid' && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-300">
              {grouped.length === 0 ? (
                <div className="col-span-full text-center text-[var(--apple-text-secondary)] font-medium py-16">
                  ไม่พบข้อมูลที่ตรงกัน
                </div>
              ) : (
                grouped.map((group) => (
                  <DeptGridCard
                    key={group.dept?.id ?? 'unmapped'}
                    group={group}
                    colorIdx={getColorIdx(group)}
                    onEmpClick={setSelectedEmp}
                  />
                ))
              )}
            </div>
          )}

        </div>
      )}

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="mt-8 flex flex-wrap gap-4 items-center justify-end print:hidden">
          <div className="flex items-center gap-2 text-xs text-[var(--apple-text-secondary)] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            พนักงานปัจจุบัน (Active)
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--apple-text-secondary)] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />
            พ้นสภาพ / ลาออก (Inactive)
          </div>
          <div className="text-xs text-[var(--apple-text-secondary)] font-medium">
            คลิกที่การ์ดพนักงานเพื่อดูข้อมูล
          </div>
        </div>
      )}

      {/* ── Employee Detail Modal ─────────────────────────────────────────── */}
      {selectedEmp && (
        <EmployeeModal
          emp={selectedEmp}
          deptName={selectedEmpDeptName}
          colorIdx={selectedEmpColorIdx}
          onClose={() => setSelectedEmp(null)}
        />
      )}
    </div>
  );
}

// ─── Stat Card sub-component ──────────────────────────────────────────────────

function StatCard({
  icon,
  bg,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="bg-white dark:bg-black/20 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-[var(--shadow-apple-soft)] p-5 flex items-center gap-4">
      <div className={`${bg} p-3 rounded-2xl shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--apple-text-secondary)] truncate">{label}</p>
        <div className="flex items-end gap-1 mt-0.5">
          <span className="text-3xl font-extrabold text-[var(--apple-text-primary)] leading-none">{value}</span>
          <span className="text-sm text-[var(--apple-text-secondary)] font-medium mb-0.5">{unit}</span>
        </div>
      </div>
    </div>
  );
}
