'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import { Plus, Search, Eye, ClipboardList, Edit, User, Smartphone, Building2, FolderOpen, MapPin, AlertTriangle, Wallet, FileText, CheckCircle, Save, Phone, Circle, UserCircle2, Clock, CalendarOff, LayoutDashboard, Settings, LogOut, BarChart3, Sun, Moon, Monitor, Flame } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingObj, setIsUploadingObj] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // 🌟 เพิ่ม State สำหรับ "โหมดดูโปรไฟล์ (View Mode)"
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState('personal');
  
  const [formData, setFormData] = useState({
    id: '', emp_code: '', fingerprint_id: '', full_name: '', department_id: '', position: '', 
    base_salary: 0, hourly_rate: 0, ot_hourly_rate: 0, status: 'Active', shift_id: 1,
    national_id: '', gender: '', birth_date: '', education: '', document_url: '',
    nickname: '', blood_type: '', religion: '', marital_status: '', military_status: '',
    address: '', phone: '', email: '', emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
    bank_name: '', bank_account_no: '', shirt_size: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: depts } = await supabase.from('departments').select('*').order('code');
      setDepartments(depts || []);

      const { data: shiftList } = await supabase.from('shifts').select('*').order('id');
      setShifts(shiftList || []);

      const { data: emps, error } = await supabase
        .from('employees')
        .select('*, departments(code, name_th)')
        .order('emp_code', { ascending: true });
        
      if (error) throw error;
      setEmployees(emps || []);
      setFilteredEmployees(emps || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let result = employees;
    if (selectedDeptId !== 'All') result = result.filter(emp => emp.department_id === selectedDeptId);
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.full_name && emp.full_name.toLowerCase().includes(lowerSearch)) ||
        (emp.emp_code && emp.emp_code.toLowerCase().includes(lowerSearch)) ||
        (emp.nickname && emp.nickname.toLowerCase().includes(lowerSearch))
      );
    }
    setFilteredEmployees(result);
  }, [searchTerm, selectedDeptId, employees]);

  const handleAddNew = () => {
    setFormData({ 
      id: '', emp_code: '', fingerprint_id: '', full_name: '', department_id: '', position: '', 
      base_salary: 0, hourly_rate: 0, ot_hourly_rate: 0, status: 'Active', shift_id: 1,
      national_id: '', gender: '', birth_date: '', education: '', document_url: '',
      nickname: '', blood_type: '', religion: '', marital_status: '', military_status: '',
      address: '', phone: '', email: '', emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
      bank_name: '', bank_account_no: '', shirt_size: ''
    });
    setIsEditing(false);
    setIsViewMode(false); // ปิดโหมดดู เปิดโหมดแก้ไข
    setActiveTab('personal');
    setIsModalOpen(true);
  };

  // 🌟 ฟังก์ชันเปิดหน้า "ดูโปรไฟล์"
  const handleViewProfile = (emp: any) => {
    setSelectedEmployee(emp);
    setIsViewMode(true); // เปิดโหมดดูโปรไฟล์
    setIsModalOpen(true);
  };

  // 🌟 ฟังก์ชันเปลี่ยนจาก "ดูโปรไฟล์" -> "แก้ไข"
  const handleEditFromView = () => {
    const emp = selectedEmployee;
    setFormData({
      id: emp.id, emp_code: emp.emp_code || '', fingerprint_id: emp.fingerprint_id || '', 
      full_name: emp.full_name || '', department_id: emp.department_id || '', position: emp.position || '', 
      base_salary: emp.base_salary || 0, hourly_rate: emp.hourly_rate || 0, ot_hourly_rate: emp.ot_hourly_rate || 0, status: emp.status || 'Active', shift_id: emp.shift_id || 1,
      national_id: emp.national_id || '', gender: emp.gender || '', birth_date: emp.birth_date || '', education: emp.education || '', document_url: emp.document_url || '',
      nickname: emp.nickname || '', blood_type: emp.blood_type || '', religion: emp.religion || '', marital_status: emp.marital_status || '', military_status: emp.military_status || '',
      address: emp.address || '', phone: emp.phone || '', email: emp.email || '', 
      emergency_contact_name: emp.emergency_contact_name || '', emergency_contact_phone: emp.emergency_contact_phone || '', emergency_contact_relation: emp.emergency_contact_relation || '',
      bank_name: emp.bank_name || '', bank_account_no: emp.bank_account_no || '', shirt_size: emp.shirt_size || ''
    });
    setIsViewMode(false);
    setIsEditing(true);
    setActiveTab('personal');
  };

  const handleDepartmentChange = (deptId: string) => {
    setFormData({ ...formData, department_id: deptId });
    if (!isEditing && deptId) {
      const dept = departments.find(d => d.id === deptId);
      if (dept && !formData.emp_code) {
        const count = employees.filter(e => e.department_id === deptId).length + 1;
        setFormData(prev => ({ ...prev, department_id: deptId, emp_code: `${dept.code}-${count.toString().padStart(3, '0')}` }));
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingObj(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `employees/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('hr_docs').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('hr_docs').getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, document_url: data.publicUrl }));
      Swal.fire({ icon: 'success', title: 'อัปโหลดสำเร็จ', text: 'แนบไฟล์เรียบร้อยแล้ว', timer: 1500 });
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'อัปโหลดล้มเหลว', text: error.message });
    } finally {
      setIsUploadingObj(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.emp_code || !formData.full_name) return alert('กรุณากรอก รหัสพนักงาน และ ชื่อ-นามสกุล ให้ครบถ้วน');

    try {
      const payload: any = { ...formData };
      delete payload.id;
      
      // แปลงค่าที่เป็น string ว่าง ให้เป็น null เพื่อป้องกัน Error ในฐานข้อมูล (โดยเฉพาะฟิลด์ประเภท Date)
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });

      let res;
      if (isEditing) {
        res = await fetch('/api/employees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: formData.id })
        });
      } else {
        res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: isEditing ? 'อัปเดตข้อมูลสำเร็จ!' : 'เพิ่มพนักงานใหม่สำเร็จ!', timer: 1500 });
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: error.message });
    }
  };

  // ฟังก์ชันคำนวณอายุจากวันเกิด
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }
    return `${age} ปี`;
  }

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto font-sans text-slate-800 dark:text-slate-100 transition-colors">
      {/* ส่วนหัว */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400 transition">&larr;</Link>
            จัดการฐานข้อมูลพนักงาน
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-10 font-medium">ระบบจัดเก็บแฟ้มประวัติ และ ข้อมูลพนักงานแบบดิจิทัล</p>
        </div>
        <button onClick={handleAddNew} className="px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-2">
          <Plus className="w-5 h-5" /> เพิ่มพนักงานใหม่
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500 dark:text-slate-400"><Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" /></span>
          <input type="text" placeholder="ค้นหาชื่อ, รหัส, ชื่อเล่น..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl outline-none font-medium transition focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button onClick={() => setSelectedDeptId('All')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${selectedDeptId === 'All' ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>ทั้งหมด</button>
          {departments.map(dept => (
            <button key={dept.id} onClick={() => setSelectedDeptId(dept.id)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${selectedDeptId === dept.id ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              {dept.code} - {dept.name_th}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400 font-medium">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50">รหัส/ระบบ</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50">ข้อมูลติดต่อ</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50">แผนก/ตำแหน่ง</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50">สถานะ</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
                {filteredEmployees.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 font-medium">ไม่พบข้อมูลพนักงาน</td></tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer" onDoubleClick={() => handleViewProfile(emp)}>
                      <td className="px-6 py-3">
                        <div className="font-black text-indigo-700 dark:text-indigo-400">{emp.emp_code}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1">สแกน: {emp.fingerprint_id || '-'}</div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700 dark:text-slate-200">{emp.full_name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ชื่อเล่น: {emp.nickname || '-'}</div>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                        <div><Phone className="w-3 h-3 mr-1 inline-block" /> {emp.phone || '-'}</div>
                        <div><User className="w-5 h-5 mr-2 inline-block" /> ฉุกเฉิน: {emp.emergency_contact_phone || '-'}</div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          {emp.departments?.name_th || 'ไม่ระบุ'}
                        </span>
                        {emp.position && <div className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1 ml-1">{emp.position}</div>}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${emp.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                          {emp.status === 'Active' ? 'ทำงานอยู่' : 'พ้นสภาพ'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button onClick={() => handleViewProfile(emp)} className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 hover:border-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold rounded-lg transition text-sm shadow-sm flex items-center gap-1 mx-auto">
                          <Eye className="w-4 h-4 mr-1" /> ดูข้อมูล
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal หลัก */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full ${isViewMode ? 'max-w-3xl' : 'max-w-4xl'} max-h-[90vh] flex flex-col overflow-hidden`}>
            
            {/* Header ของ Modal */}
            <div className={`px-6 py-4 flex justify-between items-center shrink-0 ${isViewMode ? 'bg-indigo-600 dark:bg-indigo-500 text-white' : 'bg-slate-800 dark:bg-slate-900 text-white'}`}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isViewMode ? <><ClipboardList className="w-5 h-5 mr-2" /> แฟ้มประวัติพนักงาน</> : (isEditing ? <><Edit className="w-5 h-5 mr-2" /> แก้ไขข้อมูลพนักงาน</> : <><Plus className="w-5 h-5 mr-2" /> ลงทะเบียนพนักงานใหม่</>)}
              </h2>
              <div className="flex items-center gap-4">
                {isViewMode && (
                  <button onClick={handleEditFromView} className="px-4 py-1.5 bg-white dark:bg-slate-800/20 hover:bg-white dark:bg-slate-800/30 rounded-lg text-sm font-bold backdrop-blur-sm transition">
                    <Edit className="w-4 h-4 mr-1 inline-block" /> แก้ไข
                  </button>
                )}
                <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white font-bold text-2xl leading-none">&times;</button>
              </div>
            </div>

            {/* ส่วนแสดงผลแบบ "ดูโปรไฟล์ (View Mode)" */}
            {isViewMode && selectedEmployee && (
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row gap-6 items-center md:items-start relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-2 h-full ${selectedEmployee.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  
                  <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-4xl text-indigo-500 dark:text-indigo-400 shrink-0 border-4 border-white dark:border-slate-800 shadow-sm">
                    {selectedEmployee.gender === 'หญิง' ? <UserCircle2 className="w-12 h-12" /> : <UserCircle2 className="w-12 h-12" />}
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">{selectedEmployee.full_name} {selectedEmployee.nickname && `(${selectedEmployee.nickname})`}</h2>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1 text-lg">{selectedEmployee.position || 'พนักงาน'} • {selectedEmployee.departments?.name_th || 'ไม่ระบุแผนก'}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-600">รหัส: {selectedEmployee.emp_code}</span>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-600">สแกนนิ้ว: {selectedEmployee.fingerprint_id || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-4 border-b border-slate-100 dark:border-slate-700 pb-2"><Smartphone className="w-5 h-5 mr-2 inline-block" /> การติดต่อ</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">เบอร์โทรศัพท์:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.phone || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">อีเมล:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.email || '-'}</span></div>
                      <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-700 pt-3"><span className="text-slate-500 dark:text-slate-400 font-bold">ที่อยู่ปัจจุบัน:</span></div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">{selectedEmployee.address || '-'}</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-4 border-b border-slate-100 dark:border-slate-700 pb-2"><User className="w-5 h-5 mr-2 inline-block" /> ข้อมูลส่วนบุคคล</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">เลขบัตร ปชช:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.national_id || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">วันเกิด (อายุ):</span> <span className="font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.birth_date || '-'} ({calculateAge(selectedEmployee.birth_date)})</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">เพศ / กรุ๊ปเลือด:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.gender || '-'} / {selectedEmployee.blood_type || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">วุฒิการศึกษา:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.education || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">สถานภาพ:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.marital_status || '-'}</span></div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-4 border-b border-slate-100 dark:border-slate-700 pb-2"><Wallet className="w-5 h-5 mr-2 inline-block" /> บัญชี / การจ้างงาน</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">ธนาคาร:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.bank_name || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">เลขที่บัญชี:</span> <span className="font-black text-indigo-700 dark:text-indigo-400 tracking-widest">{selectedEmployee.bank_account_no || '-'}</span></div>
                      <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-700 pt-3"><span className="text-slate-500 dark:text-slate-400">ฐานเงินเดือน:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.base_salary?.toLocaleString() || '0'} ฿</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">เรทปกติ / OT:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.hourly_rate || '0'} / {selectedEmployee.ot_hourly_rate || '0'} ฿</span></div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-4 border-b border-slate-100 dark:border-slate-700 pb-2"><AlertTriangle className="w-5 h-5 mr-2 inline-block" /> ติดต่อฉุกเฉิน & เอกสาร</h3>
                    <div className="space-y-3 text-sm bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg mb-4">
                      <div className="flex justify-between"><span className="text-rose-700 dark:text-rose-400 font-bold">ชื่อติดต่อ:</span> <span className="font-bold text-rose-800 dark:text-rose-300">{selectedEmployee.emergency_contact_name || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-rose-700 dark:text-rose-400 font-bold">เบอร์โทร / เกี่ยวข้อง:</span> <span className="font-bold text-rose-800 dark:text-rose-300">{selectedEmployee.emergency_contact_phone || '-'} ({selectedEmployee.emergency_contact_relation || '-'})</span></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">เอกสารแนบ:</span>
                      {selectedEmployee.document_url ? (
                        <a href={selectedEmployee.document_url} target="_blank" className="px-3 py-1 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-bold text-xs hover:bg-indigo-700">เปิดดูไฟล์</a>
                      ) : <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400 font-bold text-xs">ไม่มีไฟล์</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* ส่วนของ "ฟอร์มแก้ไข (Edit Mode)" */}
            {!isViewMode && (
              <>
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-x-auto shrink-0 hide-scrollbar">
                  <button type="button" onClick={() => setActiveTab('personal')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'personal' ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><User className="w-5 h-5 mr-2 inline-block" /> ข้อมูลส่วนตัว</button>
                  <button type="button" onClick={() => setActiveTab('contact')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'contact' ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Smartphone className="w-5 h-5 mr-2 inline-block" /> การติดต่อ & ฉุกเฉิน</button>
                  <button type="button" onClick={() => setActiveTab('work')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'work' ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Building2 className="w-4 h-4 mr-2 inline-block" /> ข้อมูลบริษัท & เงินเดือน</button>
                  <button type="button" onClick={() => setActiveTab('docs')} className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'docs' ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><FolderOpen className="w-4 h-4 mr-2 inline-block" /> เอกสาร & อื่นๆ</button>
                </div>
                
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {/* TAB 1: ข้อมูลส่วนตัว */}
                  {activeTab === 'personal' && (
                    <div className="space-y-5 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ชื่อ-นามสกุล *</label>
                          <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ชื่อเล่น</label>
                          <input type="text" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">เลขบัตรประชาชน (13 หลัก)</label>
                          <input type="text" maxLength={13} value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">วัน/เดือน/ปีเกิด</label>
                          <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white" />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">เพศ</label>
                          <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white">
                            <option value="">ไม่ระบุ</option><option value="ชาย">ชาย</option><option value="หญิง">หญิง</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">กรุ๊ปเลือด</label>
                          <select value={formData.blood_type} onChange={e => setFormData({...formData, blood_type: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white">
                            <option value="">ไม่ระบุ</option><option value="A">A</option><option value="B">B</option><option value="O">O</option><option value="AB">AB</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ศาสนา</label>
                          <input type="text" value={formData.religion} onChange={e => setFormData({...formData, religion: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">สถานภาพ</label>
                          <select value={formData.marital_status} onChange={e => setFormData({...formData, marital_status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white">
                            <option value="">ไม่ระบุ</option><option value="โสด">โสด</option><option value="สมรส">สมรส</option><option value="หย่าร้าง">หย่าร้าง</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">วุฒิการศึกษาสูงสุด</label>
                          <input type="text" placeholder="เช่น ปริญญาตรี" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">สถานภาพทางทหาร (เฉพาะชาย)</label>
                          <select value={formData.military_status} onChange={e => setFormData({...formData, military_status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white">
                            <option value="">ไม่ระบุ</option><option value="ผ่านเกณฑ์แล้ว">ผ่านเกณฑ์แล้ว</option><option value="ได้รับการยกเว้น">ได้รับการยกเว้น</option><option value="ยังไม่เกณฑ์">ยังไม่เกณฑ์</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ติดต่อ & ฉุกเฉิน */}
                  {activeTab === 'contact' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-3"><MapPin className="w-5 h-5 mr-2 inline-block" /> ข้อมูลการติดต่อปัจจุบัน</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">เบอร์โทรศัพท์มือถือ</label>
                            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">อีเมลส่วนตัว</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ที่อยู่ปัจจุบัน (ห้องพัก/บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์)</label>
                          <textarea rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-white resize-none"></textarea>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-rose-700 dark:text-rose-400 border-b border-rose-100 dark:border-rose-900 pb-2 mb-3"><AlertTriangle className="w-5 h-5 mr-2 inline-block" /> ข้อมูลผู้ติดต่อฉุกเฉิน</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ชื่อ-นามสกุล</label>
                            <input type="text" value={formData.emergency_contact_name} onChange={e => setFormData({...formData, emergency_contact_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-lg outline-none text-slate-700 dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">เบอร์โทรศัพท์</label>
                            <input type="tel" value={formData.emergency_contact_phone} onChange={e => setFormData({...formData, emergency_contact_phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-lg outline-none text-slate-700 dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ความสัมพันธ์ (เช่น บิดา)</label>
                            <input type="text" value={formData.emergency_contact_relation} onChange={e => setFormData({...formData, emergency_contact_relation: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-lg outline-none text-slate-700 dark:text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: บริษัท & เงินเดือน */}
                  {activeTab === 'work' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">รหัสบริษัท (แสดงผล) *</label>
                          <input required type="text" value={formData.emp_code} onChange={e => setFormData({...formData, emp_code: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-indigo-700 dark:text-indigo-400 mb-4" />
                          
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">รหัสเครื่องสแกนนิ้ว</label>
                          <input type="text" value={formData.fingerprint_id} onChange={e => setFormData({...formData, fingerprint_id: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-600 dark:text-slate-300" />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">เลือกแผนก</label>
                            <select value={formData.department_id} onChange={e => handleDepartmentChange(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-700 dark:text-slate-200">
                              <option value="">-- ไม่ระบุแผนก --</option>
                              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.code} - {dept.name_th}</option>)}
                            </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">กะการทำงาน (Shift)</label>
                              <select value={formData.shift_id} onChange={e => setFormData({...formData, shift_id: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-700 dark:text-slate-200">
                                {shifts.map(shift => <option key={shift.id} value={shift.id}>{shift.name_th} ({shift.time_in} - {shift.time_out})</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">กะการทำงาน (Shift)</label>
                              <select value={formData.shift_id} onChange={e => setFormData({...formData, shift_id: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-700 dark:text-slate-200">
                                {shifts.map(shift => <option key={shift.id} value={shift.id}>{shift.name_th} ({shift.time_in} - {shift.time_out})</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ตำแหน่ง</label>
                            <input type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-slate-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">สถานะพนักงาน</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-700 dark:text-slate-200">
                              <option value="Active">ทำงานอยู่</option>
                              <option value="Inactive">พ้นสภาพ</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-400 mb-3 text-sm"><Wallet className="w-5 h-5 mr-2 inline-block" /> ค่าจ้าง & บัญชีรับเงินเดือน</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                          <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">ฐานเงินเดือน</label>
                            <input type="number" step="any" value={formData.base_salary} onChange={e => setFormData({...formData, base_salary: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-800 dark:text-slate-200" />
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">เรทปกติ (บาท/ชม.)</label>
                            <input type="number" step="any" value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 rounded-lg outline-none font-bold text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-orange-700 dark:text-orange-400 mb-1">เรท OT (บาท/ชม.)</label>
                            <input type="number" step="any" value={formData.ot_hourly_rate} onChange={e => setFormData({...formData, ot_hourly_rate: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-700 rounded-lg outline-none font-bold text-orange-600 dark:text-orange-400" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/50 border-dashed">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">ชื่อธนาคาร (เช่น KBank)</label>
                            <input type="text" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-slate-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">เลขที่บัญชี</label>
                            <input type="text" value={formData.bank_account_no} onChange={e => setFormData({...formData, bank_account_no: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-700 dark:text-slate-200 tracking-wider" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: เอกสาร */}
                  {activeTab === 'docs' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-800 dark:text-white mb-1">แนบไฟล์เอกสารประวัติ</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">รองรับไฟล์รูปภาพและ PDF (รวมเป็นไฟล์เดียว)</p>
                        <div className="flex flex-col items-center justify-center gap-3">
                          <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} disabled={isUploadingObj} className="text-sm file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-600 dark:bg-indigo-500 file:text-white hover:file:bg-indigo-700 cursor-pointer shadow-sm" />
                          {isUploadingObj && <span className="text-sm text-indigo-500 font-bold animate-pulse">กำลังอัปโหลดไฟล์ไปที่ Cloud...</span>}
                        </div>
                        {formData.document_url && (
                          <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl font-bold border border-emerald-200">
                            <CheckCircle className="w-5 h-5 mr-1 inline-block" /> มีไฟล์ในระบบแล้ว
                            <a href={formData.document_url} target="_blank" className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-emerald-700">ดูไฟล์</a>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ไซส์เสื้อพนักงาน</label>
                          <select value={formData.shirt_size} onChange={e => setFormData({...formData, shirt_size: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-slate-200">
                            <option value="">ไม่ระบุ</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ปุ่ม Save ของโหมด Edit */}
                  <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-800 pb-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3.5 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition shadow-sm">
                      ยกเลิก
                    </button>
                    <button type="submit" className="flex-[2] px-4 py-3.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md text-lg">
                      <Save className="w-5 h-5 mr-2 inline-block" /> บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
