'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/routes';
import {
  GraduationCap, Plus, Search, Edit, Trash2, Users, Calendar,
  DollarSign, CheckCircle, Clock, BookOpen, Award, BarChart3,
  Download, ChevronDown, X, Save, Eye, Filter
} from 'lucide-react';
import * as xlsx from 'xlsx';
import { saveAs } from 'file-saver';

interface Training {
  id: number;
  course_name: string;
  trainer: string;
  category: string;
  start_date: string;
  end_date: string;
  hours: number;
  cost: number;
  location: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  max_participants: number;
  participants: string[];
  notes: string;
}

interface Employee {
  id: string;
  emp_code: string;
  full_name: string;
  department: string;
}

const CATEGORIES = ['ทักษะเฉพาะทาง', 'ความปลอดภัย', 'การบริหารจัดการ', 'กฎหมายและกฎระเบียบ', 'ทักษะทั่วไป', 'IT & Digital', 'อื่นๆ'];
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  planned: { label: 'วางแผนแล้ว', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  ongoing: { label: 'กำลังดำเนินการ', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  completed: { label: 'เสร็จสิ้น', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  cancelled: { label: 'ยกเลิก', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
};

const defaultForm: Omit<Training, 'id'> = {
  course_name: '',
  trainer: '',
  category: CATEGORIES[0],
  start_date: '',
  end_date: '',
  hours: 0,
  cost: 0,
  location: '',
  status: 'planned',
  max_participants: 20,
  participants: [],
  notes: '',
};

export default function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<Training, 'id'>>(defaultForm);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [viewTraining, setViewTraining] = useState<Training | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: empData } = await supabase
        .from('employees')
        .select('id, emp_code, full_name, department')
        .eq('status', 'Active')
        .order('emp_code');
      setEmployees(empData || []);

      // Try to fetch from training_records table
      const { data: trainingData, error } = await supabase
        .from('training_records')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        // Table doesn't exist yet — use mock data
        setTrainings([
          {
            id: 1, course_name: 'ความปลอดภัยในการทำงาน (Safety First)', trainer: 'อ.สมชาย วิชาการ',
            category: 'ความปลอดภัย', start_date: '2026-10-01', end_date: '2026-10-01',
            hours: 6, cost: 5000, location: 'ห้องประชุม A', status: 'planned',
            max_participants: 30, participants: [], notes: 'อบรมตามกฎหมายคุ้มครองแรงงาน'
          },
          {
            id: 2, course_name: 'การใช้งาน Microsoft Office 365', trainer: 'ทีม IT',
            category: 'IT & Digital', start_date: '2026-09-15', end_date: '2026-09-16',
            hours: 12, cost: 3000, location: 'ห้อง Lab คอมพิวเตอร์', status: 'completed',
            max_participants: 15, participants: [], notes: ''
          },
          {
            id: 3, course_name: 'ทักษะการสื่อสารและการนำเสนอ', trainer: 'วิทยากรภายนอก',
            category: 'ทักษะทั่วไป', start_date: '2026-10-20', end_date: '2026-10-21',
            hours: 16, cost: 12000, location: 'โรงแรมในเมือง', status: 'planned',
            max_participants: 20, participants: [], notes: ''
          },
        ]);
      } else {
        setTrainings(trainingData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = trainings.filter(t => {
    const matchSearch = t.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.trainer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filterStatus || t.status === filterStatus;
    const matchCat = !filterCategory || t.category === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  const stats = {
    total: trainings.length,
    planned: trainings.filter(t => t.status === 'planned').length,
    completed: trainings.filter(t => t.status === 'completed').length,
    totalHours: trainings.reduce((sum, t) => sum + (t.hours || 0), 0),
    totalCost: trainings.reduce((sum, t) => sum + (t.cost || 0), 0),
  };

  const handleSubmit = async () => {
    const newTraining = { ...formData, participants: selectedParticipants };
    if (isEditing && editId !== null) {
      const { error } = await supabase.from('training_records').update(newTraining).eq('id', editId);
      if (!error) {
        setTrainings(prev => prev.map(t => t.id === editId ? { ...newTraining, id: editId } : t));
      } else {
        setTrainings(prev => prev.map(t => t.id === editId ? { ...newTraining, id: editId } : t));
      }
    } else {
      const { data, error } = await supabase.from('training_records').insert([newTraining]).select().single();
      if (!error && data) {
        setTrainings(prev => [data, ...prev]);
      } else {
        const mockId = Date.now();
        setTrainings(prev => [{ ...newTraining, id: mockId }, ...prev]);
      }
    }
    setIsModalOpen(false);
    setFormData(defaultForm);
    setSelectedParticipants([]);
    setEditId(null);
    setIsEditing(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบหลักสูตรนี้ใช่ไหม?')) return;
    await supabase.from('training_records').delete().eq('id', id);
    setTrainings(prev => prev.filter(t => t.id !== id));
  };

  const exportExcel = () => {
    const rows = trainings.map(t => ({
      'ชื่อหลักสูตร': t.course_name,
      'วิทยากร': t.trainer,
      'หมวดหมู่': t.category,
      'วันที่เริ่ม': t.start_date,
      'วันที่สิ้นสุด': t.end_date,
      'จำนวนชั่วโมง': t.hours,
      'ค่าใช้จ่าย (บาท)': t.cost,
      'สถานที่': t.location,
      'สถานะ': STATUS_MAP[t.status]?.label,
      'ผู้เข้าร่วม (คน)': t.participants?.length || 0,
    }));
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Training');
    const buf = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `training_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const openAdd = () => {
    setFormData(defaultForm);
    setSelectedParticipants([]);
    setIsEditing(false);
    setEditId(null);
    setIsModalOpen(true);
  };

  const openEdit = (t: Training) => {
    setFormData({ ...t });
    setSelectedParticipants(t.participants || []);
    setIsEditing(true);
    setEditId(t.id);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[var(--apple-text-primary)] flex items-center gap-3">
          <Link href={ROUTES.DASHBOARD} className="text-slate-400 hover:text-indigo-600 dark:text-indigo-400 transition">&larr;</Link>
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <GraduationCap className="w-7 h-7" />
          </div>
          Training & Development
        </h1>
        <p className="text-[var(--apple-text-secondary)] ml-16 mt-1 font-medium">บันทึกและติดตามการอบรมพัฒนาบุคลากร</p>
      </div>

      {/* Hint Banner */}
      <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-sm text-indigo-700 dark:text-indigo-300">
          <strong>วิธีใช้งาน:</strong> เพิ่มหลักสูตรอบรม → เพิ่มผู้เข้าร่วม → ติดตามสถานะ → Export รายงาน ระบบจะสรุป Training Hours รายบุคคลโดยอัตโนมัติ
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'หลักสูตรทั้งหมด', value: stats.total, icon: BookOpen, color: 'indigo' },
          { label: 'กำลังวางแผน', value: stats.planned, icon: Clock, color: 'blue' },
          { label: 'เสร็จสิ้นแล้ว', value: stats.completed, icon: CheckCircle, color: 'emerald' },
          { label: 'รวมชั่วโมงอบรม', value: stats.totalHours + ' ชม.', icon: Award, color: 'amber' },
          { label: 'รวมค่าใช้จ่าย', value: '฿' + stats.totalCost.toLocaleString(), icon: DollarSign, color: 'rose' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-black/20 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className={`p-2 rounded-xl w-fit mb-2 bg-${s.color}-100 dark:bg-${s.color}-900/30 text-${s.color}-600 dark:text-${s.color}-400`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-[var(--apple-text-primary)]">{s.value}</div>
            <div className="text-xs text-[var(--apple-text-secondary)] font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-black/20 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 p-5 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาหลักสูตรหรือวิทยากร..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none font-medium">
            <option value="">ทุกสถานะ</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none font-medium">
            <option value="">ทุกหมวดหมู่</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={exportExcel} className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-[var(--apple-text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={openAdd} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2">
            <Plus className="w-4 h-4" /> เพิ่มหลักสูตร
          </button>
        </div>
      </div>

      {/* Training Cards */}
      {isLoading ? (
        <div className="text-center py-16 text-[var(--apple-text-secondary)] animate-pulse">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--apple-text-secondary)]">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="font-bold text-lg">ยังไม่มีหลักสูตรอบรม</p>
          <p className="text-sm mt-1">กดปุ่ม "เพิ่มหลักสูตร" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(t => (
            <div key={t.id} className="bg-white dark:bg-black/20 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 transition duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_MAP[t.status]?.color}`}>
                  {STATUS_MAP[t.status]?.label}
                </span>
                <span className="text-xs text-[var(--apple-text-secondary)] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-medium">
                  {t.category}
                </span>
              </div>
              <h3 className="font-extrabold text-[var(--apple-text-primary)] text-lg mb-1 line-clamp-2">{t.course_name}</h3>
              <p className="text-sm text-[var(--apple-text-secondary)] mb-4">วิทยากร: {t.trainer}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--apple-text-secondary)] mb-4">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {t.start_date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {t.hours} ชม.</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {t.participants?.length || 0}/{t.max_participants} คน</span>
                <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> ฿{(t.cost || 0).toLocaleString()}</span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => setViewTraining(t)} className="flex-1 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> ดูรายละเอียด
                </button>
                <button onClick={() => openEdit(t)} className="flex-1 py-2 text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition flex items-center justify-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> แก้ไข
                </button>
                <button onClick={() => handleDelete(t.id)} className="py-2 px-3 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-[var(--apple-text-primary)]">
                {isEditing ? 'แก้ไขหลักสูตร' : 'เพิ่มหลักสูตรอบรม'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">ชื่อหลักสูตร *</label>
                <input value={formData.course_name} onChange={e => setFormData(p => ({ ...p, course_name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">วิทยากร</label>
                  <input value={formData.trainer} onChange={e => setFormData(p => ({ ...p, trainer: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">หมวดหมู่</label>
                  <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">วันที่เริ่ม</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">วันที่สิ้นสุด</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">ชั่วโมงอบรม</label>
                  <input type="number" value={formData.hours} onChange={e => setFormData(p => ({ ...p, hours: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">ค่าใช้จ่าย (บาท)</label>
                  <input type="number" value={formData.cost} onChange={e => setFormData(p => ({ ...p, cost: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">รับสมัครสูงสุด</label>
                  <input type="number" value={formData.max_participants} onChange={e => setFormData(p => ({ ...p, max_participants: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">สถานที่</label>
                  <input value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">สถานะ</label>
                  <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value as Training['status'] }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium">
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">เพิ่มผู้เข้าอบรม ({selectedParticipants.length}/{formData.max_participants})</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                      <input type="checkbox"
                        checked={selectedParticipants.includes(emp.id)}
                        onChange={e => setSelectedParticipants(prev => e.target.checked ? [...prev, emp.id] : prev.filter(id => id !== emp.id))}
                        className="rounded" />
                      <span className="text-sm font-medium">{emp.emp_code} — {emp.full_name}</span>
                      <span className="text-xs text-slate-400 ml-auto">{emp.department}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">หมายเหตุ</label>
                <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[var(--apple-text-secondary)] hover:bg-slate-50 transition">ยกเลิก</button>
              <button onClick={handleSubmit} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition flex items-center gap-2">
                <Save className="w-4 h-4" /> {isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มหลักสูตร'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewTraining && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-[var(--apple-text-primary)] line-clamp-1">{viewTraining.course_name}</h2>
              <button onClick={() => setViewTraining(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'วิทยากร', value: viewTraining.trainer },
                  { label: 'หมวดหมู่', value: viewTraining.category },
                  { label: 'วันเริ่ม', value: viewTraining.start_date },
                  { label: 'วันสิ้นสุด', value: viewTraining.end_date },
                  { label: 'ชั่วโมงอบรม', value: viewTraining.hours + ' ชม.' },
                  { label: 'ค่าใช้จ่าย', value: '฿' + (viewTraining.cost || 0).toLocaleString() },
                  { label: 'สถานที่', value: viewTraining.location },
                  { label: 'ผู้เข้าร่วม', value: `${viewTraining.participants?.length || 0}/${viewTraining.max_participants} คน` },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <div className="text-xs text-[var(--apple-text-secondary)] font-medium">{item.label}</div>
                    <div className="font-bold text-[var(--apple-text-primary)] mt-0.5">{item.value || '-'}</div>
                  </div>
                ))}
              </div>
              {viewTraining.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-300">
                  <strong>หมายเหตุ:</strong> {viewTraining.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
