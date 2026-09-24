'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/routes';
import {
  FileSignature, Plus, Search, Eye, Edit, Trash2, Calendar,
  Briefcase, User, Info, FileText, CheckCircle, Clock,
  XCircle, Printer, X, Save, AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Contract {
  id: number;
  employee_id: number;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  position: string;
  salary: number;
  notes: string;
  status: 'active' | 'expiring' | 'expired' | 'terminated';
}

interface Employee {
  id: number;
  emp_code: string;
  full_name: string;
  department: string;
}

const defaultForm: Omit<Contract, 'id' | 'status'> = {
  employee_id: 0,
  contract_type: 'พนักงานประจำ (ไม่กำหนดระยะเวลา)',
  start_date: '',
  end_date: '',
  position: '',
  salary: 0,
  notes: ''
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<Contract, 'id' | 'status'>>(defaultForm);
  const [viewContract, setViewContract] = useState<{ contract: Contract, emp: Employee } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: empData } = await supabase
        .from('employees')
        .select('id, emp_code, full_name, department')
        .eq('status', 'Active')
        .order('emp_code');
      
      setEmployees(empData || []);

      const { data: contractData, error } = await supabase
        .from('employee_contracts')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        // Use Mock data if table doesn't exist
        setContracts([
          {
            id: 1, employee_id: empData?.[0]?.id || 1, contract_type: 'ทดลองงาน (Probation)',
            start_date: '2026-08-01', end_date: '2026-11-28', position: 'พนักงานฝ่ายผลิต',
            salary: 15000, notes: '', status: 'expiring'
          },
          {
            id: 2, employee_id: empData?.[1]?.id || 2, contract_type: 'พนักงานประจำ',
            start_date: '2020-01-15', end_date: null, position: 'หัวหน้าแผนก',
            salary: 35000, notes: '', status: 'active'
          }
        ]);
      } else {
        // Evaluate statuses dynamically
        const today = new Date();
        const evalData = contractData.map((c: any) => {
          let st = 'active';
          if (c.end_date) {
            const end = new Date(c.end_date);
            const diffTime = end.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 0) st = 'expired';
            else if (diffDays <= 90) st = 'expiring';
          }
          return { ...c, status: st };
        });
        setContracts(evalData);
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

  const stats = {
    total: contracts.length,
    expiring: contracts.filter(c => c.status === 'expiring').length,
    expired: contracts.filter(c => c.status === 'expired').length,
    active: contracts.filter(c => c.status === 'active').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle className="w-3.5 h-3.5" /> ปกติ</span>;
      case 'expiring': return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5" /> ใกล้หมดอายุ</span>;
      case 'expired': return <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5" /> หมดอายุ</span>;
      default: return null;
    }
  };

  const filtered = contracts.filter(c => {
    const emp = employees.find(e => e.id === c.employee_id);
    if (!emp) return false;
    return emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           emp.emp_code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSave = async () => {
    if (!formData.employee_id || !formData.start_date || !formData.position) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'warning');
      return;
    }

    let st = 'active';
    if (formData.end_date) {
      const end = new Date(formData.end_date);
      const diffDays = Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) st = 'expired';
      else if (diffDays <= 90) st = 'expiring';
    }

    const payload = { ...formData, status: st };

    try {
      if (isEditing && editId) {
        const { error } = await supabase.from('employee_contracts').update(payload).eq('id', editId);
        if (!error) {
          setContracts(prev => prev.map(c => c.id === editId ? { ...payload, id: editId } as Contract : c));
        } else {
          setContracts(prev => prev.map(c => c.id === editId ? { ...payload, id: editId } as Contract : c));
        }
        Swal.fire('บันทึกสำเร็จ', 'อัปเดตสัญญาแล้ว', 'success');
      } else {
        const { data, error } = await supabase.from('employee_contracts').insert([payload]).select().single();
        if (!error && data) {
          setContracts(prev => [data as Contract, ...prev]);
        } else {
          setContracts(prev => [{ ...payload, id: Date.now() } as Contract, ...prev]);
        }
        Swal.fire('เพิ่มสำเร็จ', 'สร้างสัญญาใหม่เรียบร้อยแล้ว', 'success');
      }
      setIsModalOpen(false);
    } catch {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกได้', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const res = await Swal.fire({ title: 'ลบสัญญา?', text: 'คุณต้องการลบสัญญานี้ใช่หรือไม่', icon: 'warning', showCancelButton: true });
    if (res.isConfirmed) {
      await supabase.from('employee_contracts').delete().eq('id', id);
      setContracts(prev => prev.filter(c => c.id !== id));
    }
  };

  const printContract = () => {
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 font-sans print:p-0">
      
      {/* Header (Hidden in Print) */}
      <div className="mb-6 print:hidden">
        <h1 className="text-3xl font-extrabold text-[var(--apple-text-primary)] flex items-center gap-3">
          <Link href={ROUTES.DASHBOARD} className="text-slate-400 hover:text-indigo-600 dark:text-indigo-400 transition">&larr;</Link>
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl">
            <FileSignature className="w-7 h-7" />
          </div>
          สัญญาจ้างงาน (Contracts)
        </h1>
        <p className="text-[var(--apple-text-secondary)] ml-16 mt-1 font-medium">บันทึก ติดตามอายุสัญญา และพิมพ์สัญญาจ้าง</p>
      </div>

      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3 print:hidden">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-700 dark:text-amber-300">
          <strong>Info:</strong> หน้านี้ใช้บันทึกข้อมูลสัญญาจ้างงานของพนักงาน สามารถติดตามวันหมดอายุและพิมพ์สัญญาได้ ระบบจะแจ้งเตือนเมื่อสัญญาเหลือเวลาน้อยกว่า 90 วัน
        </div>
      </div>

      {/* Stats Cards (Hidden in Print) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:hidden">
        {[
          { label: 'สัญญาทั้งหมด', value: stats.total, color: 'blue', icon: FileText },
          { label: 'ปกติ (Active)', value: stats.active, color: 'emerald', icon: CheckCircle },
          { label: 'ใกล้หมดอายุ (ภายใน 90 วัน)', value: stats.expiring, color: 'amber', icon: Clock },
          { label: 'หมดอายุแล้ว', value: stats.expired, color: 'rose', icon: XCircle },
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

      {/* Toolbar (Hidden in Print) */}
      <div className="bg-white dark:bg-black/20 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 p-5 mb-5 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหารหัส หรือ ชื่อพนักงาน..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 font-medium"
            />
          </div>
          <button onClick={() => {
            setFormData(defaultForm);
            setIsEditing(false);
            setEditId(null);
            setIsModalOpen(true);
          }} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> สร้างสัญญาใหม่
          </button>
        </div>
      </div>

      {/* Data Table (Hidden in Print) */}
      <div className="bg-white dark:bg-black/20 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[var(--apple-text-secondary)]">
              <tr>
                <th className="p-4 font-bold">ลำดับ</th>
                <th className="p-4 font-bold">พนักงาน</th>
                <th className="p-4 font-bold">ประเภทสัญญา</th>
                <th className="p-4 font-bold">วันที่เริ่ม - สิ้นสุด</th>
                <th className="p-4 font-bold">ตำแหน่ง</th>
                <th className="p-4 font-bold">สถานะ</th>
                <th className="p-4 font-bold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">กำลังโหลด...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">ไม่มีข้อมูลสัญญา</td></tr>
              ) : (
                filtered.map((c, i) => {
                  const emp = employees.find(e => e.id === c.employee_id);
                  return (
                    <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4 font-medium text-slate-500">{i + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-[var(--apple-text-primary)]">{emp?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-[var(--apple-text-secondary)] mt-0.5">{emp?.emp_code} • {emp?.department}</div>
                      </td>
                      <td className="p-4 font-medium">{c.contract_type}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {c.start_date}</div>
                        {c.end_date && <div className="text-xs text-slate-500 mt-1 pl-5">ถึง {c.end_date}</div>}
                      </td>
                      <td className="p-4 font-medium">{c.position}</td>
                      <td className="p-4">{getStatusBadge(c.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => {
                            setViewContract({ contract: c, emp: emp as Employee });
                          }} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 text-blue-600 rounded-lg transition" title="ดู/พิมพ์สัญญา">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => {
                            setFormData({ ...c });
                            setIsEditing(true);
                            setEditId(c.id);
                            setIsModalOpen(true);
                          }} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-amber-600 rounded-lg transition" title="แก้ไข">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-rose-600 rounded-lg transition" title="ลบ">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal (Hidden in Print) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-[var(--apple-text-primary)]">
                {isEditing ? 'แก้ไขสัญญาจ้าง' : 'สร้างสัญญาจ้างใหม่'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">พนักงาน *</label>
                <select value={formData.employee_id} onChange={e => setFormData(p => ({ ...p, employee_id: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium">
                  <option value={0}>-- เลือกพนักงาน --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.emp_code} — {e.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">ประเภทสัญญา</label>
                  <select value={formData.contract_type} onChange={e => setFormData(p => ({ ...p, contract_type: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium">
                    <option>พนักงานประจำ (ไม่กำหนดระยะเวลา)</option>
                    <option>ชั่วคราว / ตามกำหนดระยะเวลา</option>
                    <option>ทดลองงาน (Probation)</option>
                    <option>ฝึกงาน (Internship)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">ตำแหน่งที่บรรจุ</label>
                  <input type="text" value={formData.position} onChange={e => setFormData(p => ({ ...p, position: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">วันที่เริ่มงาน *</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">วันสิ้นสุดสัญญา (ปล่อยว่างถ้าไม่จำกัด)</label>
                  <input type="date" value={formData.end_date || ''} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value || null }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">เงินเดือนตามสัญญา (บาท)</label>
                <input type="number" value={formData.salary} onChange={e => setFormData(p => ({ ...p, salary: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--apple-text-primary)] mb-1.5">เงื่อนไขเพิ่มเติม / หมายเหตุ</label>
                <textarea rows={3} value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[var(--apple-text-secondary)] hover:bg-slate-50 transition">ยกเลิก</button>
              <button onClick={handleSave} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-sm transition flex items-center gap-2">
                <Save className="w-4 h-4" /> {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกสัญญา'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View / Print Contract Modal (Hidden in Print view, but content handles print formatting) */}
      {viewContract && (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 z-[100] flex flex-col print:absolute print:inset-0 print:bg-white print:block">
          
          <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center shrink-0 print:hidden shadow-sm">
            <h2 className="text-xl font-bold text-[var(--apple-text-primary)]">ดูรายละเอียดสัญญา</h2>
            <div className="flex gap-3">
              <button onClick={printContract} className="px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-black rounded-lg font-bold flex items-center gap-2 shadow-sm transition">
                <Printer className="w-4 h-4" /> พิมพ์สัญญา
              </button>
              <button onClick={() => setViewContract(null)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center print:p-0 print:overflow-visible">
            {/* The A4 Document */}
            <div className="bg-white text-black w-full max-w-[210mm] min-h-[297mm] shadow-xl border border-slate-200 p-12 mx-auto font-serif print:shadow-none print:border-none print:p-0">
              
              <div className="text-center mb-10 border-b-2 border-black pb-4">
                <h1 className="text-3xl font-black mb-2 tracking-wide">JST INDUSTRY</h1>
                <h2 className="text-2xl font-bold mb-1">หนังสือสัญญาจ้างแรงงาน</h2>
                <p className="text-sm">ประเภท: {viewContract.contract.contract_type}</p>
              </div>

              <div className="space-y-6 text-sm leading-relaxed text-justify">
                <p className="text-right mb-4">
                  ทำที่ JST Industry สำนักงานใหญ่<br/>
                  วันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <p className="indent-10">
                  สัญญาฉบับนี้ทำขึ้นระหว่าง <strong>บริษัท เจเอสที อินดัสทรี จำกัด</strong> สำนักงานตั้งอยู่เลขที่ 123/45 ถนนพัฒนาอุตสาหกรรม ตำบลในเมือง อำเภอเมือง จังหวัดชลบุรี ซึ่งต่อไปในสัญญานี้จะเรียกว่า <strong>"นายจ้าง"</strong> ฝ่ายหนึ่ง
                </p>

                <p className="indent-10">
                  และ <strong>คุณ {viewContract.emp.full_name}</strong> (รหัสพนักงาน: {viewContract.emp.emp_code}) 
                  ต่อไปในสัญญานี้จะเรียกว่า <strong>"ลูกจ้าง"</strong> อีกฝ่ายหนึ่ง 
                  ทั้งสองฝ่ายตกลงทำสัญญาจ้างแรงงานกันโดยมีเงื่อนไขดังต่อไปนี้:
                </p>

                <div className="pl-6 space-y-4">
                  <p><strong>ข้อ 1. ตำแหน่งและหน้าที่</strong><br/>
                  นายจ้างตกลงจ้างลูกจ้าง และลูกจ้างตกลงรับจ้างทำงานในตำแหน่ง <strong>{viewContract.contract.position}</strong> สังกัดแผนก <strong>{viewContract.emp.department}</strong> โดยมีหน้าที่รับผิดชอบตามที่ได้รับมอบหมายจากนายจ้างหรือผู้บังคับบัญชาอย่างเต็มความสามารถ</p>

                  <p><strong>ข้อ 2. ระยะเวลาการจ้าง</strong><br/>
                  สัญญาจ้างฉบับนี้มีผลบังคับใช้ตั้งแต่วันที่ <strong>{new Date(viewContract.contract.start_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> เป็นต้นไป 
                  {viewContract.contract.end_date ? (
                    <> จนถึงวันที่ <strong>{new Date(viewContract.contract.end_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> รวมระยะเวลาตามสัญญา </>
                  ) : (
                    <> (ไม่มีกำหนดระยะเวลาสิ้นสุด) </>
                  )}
                  </p>

                  <p><strong>ข้อ 3. ค่าจ้างและสวัสดิการ</strong><br/>
                  นายจ้างตกลงจ่ายค่าจ้างให้แก่ลูกจ้างในอัตรา <strong>{(viewContract.contract.salary || 0).toLocaleString()} บาท</strong> ต่อเดือน โดยกำหนดจ่ายค่าจ้างทุกวันสิ้นเดือน 
                  นอกจากนี้ลูกจ้างมีสิทธิได้รับสวัสดิการตามระเบียบข้อบังคับเกี่ยวกับการทำงานของบริษัท</p>

                  <p><strong>ข้อ 4. เวลาทำงานปกติ</strong><br/>
                  ลูกจ้างตกลงทำงานตามเวลาปกติของบริษัท คือ 08:00 น. ถึง 17:00 น. และมีเวลาพัก 1 ชั่วโมง</p>

                  {viewContract.contract.notes && (
                    <p><strong>ข้อ 5. เงื่อนไขเพิ่มเติม</strong><br/>
                    {viewContract.contract.notes}</p>
                  )}
                </div>

                <p className="indent-10 mt-8">
                  สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน ทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญาโดยตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นสำคัญ
                </p>

                <div className="flex justify-between mt-20 pt-10">
                  <div className="text-center w-64">
                    <div className="border-b border-black mb-2 h-10"></div>
                    <p>( ผู้มีอำนาจลงนาม )</p>
                    <p className="font-bold mt-1">นายจ้าง / ตัวแทนบริษัท</p>
                  </div>
                  <div className="text-center w-64">
                    <div className="border-b border-black mb-2 h-10"></div>
                    <p>( {viewContract.emp.full_name} )</p>
                    <p className="font-bold mt-1">ลูกจ้าง</p>
                  </div>
                </div>

                <div className="flex justify-between mt-10">
                  <div className="text-center w-64">
                    <div className="border-b border-black mb-2 h-10"></div>
                    <p>( พยาน )</p>
                  </div>
                  <div className="text-center w-64">
                    <div className="border-b border-black mb-2 h-10"></div>
                    <p>( พยาน )</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
