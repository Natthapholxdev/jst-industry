'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';
import { Settings as SettingsIcon, Clock, Flame, Sun, Moon, Monitor, Save, Plus } from 'lucide-react';
import ShiftManager from '@/app/components/ShiftManager';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [settings, setSettings] = useState({
    shift_name: 'กะปกติ (Normal)',
    morning_in_end: '10:30',
    lunch_out_end: '12:30',
    afternoon_in_end: '14:00',
    evening_out_end: '17:30',
    ot_in_end: '18:30',
    prevent_double_scan_mins: 10
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data) setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Failed to fetch settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9:]/g, ''); // allow only numbers and colon
    if (val.length === 2 && !val.includes(':') && e.target.value.length === 2) {
      val += ':';
    }
    setSettings({ ...settings, [e.target.name]: val });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) setMessage({ text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว', type: 'success' });
      else setMessage({ text: 'เกิดข้อผิดพลาดในการบันทึก', type: 'error' });
    } catch (error) {
      setMessage({ text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto font-sans">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 transition">&larr;</Link>
          ตั้งค่าระบบ
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 ml-10 font-medium">กำหนดเวลาการทำงานและเงื่อนไขของระบบ</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 font-bold text-center shadow-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <SettingsIcon className="text-indigo-500 w-6 h-6" /> ตั้งค่าระบบพื้นฐาน
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ชื่อกะการทำงาน</label>
              <input type="text" name="shift_name" value={settings.shift_name} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ป้องกันการสแกนนิ้วซ้ำภายใน (นาที)</label>
              <input type="number" name="prevent_double_scan_mins" value={settings.prevent_double_scan_mins} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium dark:text-white" />
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">ธีมของระบบ (โทนสี)</h3>
            <div className="flex flex-wrap items-center gap-3">
              <button 
                type="button" 
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold border transition ${theme === 'light' ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <Sun className="w-4 h-4" /> สว่าง
              </button>
              <button 
                type="button" 
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold border transition ${theme === 'dark' ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <Moon className="w-4 h-4" /> มืด
              </button>
              <button 
                type="button" 
                onClick={() => setTheme('system')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold border transition ${theme === 'system' ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <Monitor className="w-4 h-4" /> ตามระบบ (OS)
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-500" /> เวลาตัดรอบกะปกติ (แบบ 24 ชั่วโมง)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">เข้างาน (เช้า) ไม่เกิน</label>
              <input type="text" maxLength={5} placeholder="08:00" name="morning_in_end" value={settings.morning_in_end} onChange={handleChange} className="w-full mt-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-center font-bold dark:text-white tracking-widest" />
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">พักเที่ยง เริ่มตั้งแต่</label>
              <input type="text" maxLength={5} placeholder="12:00" name="lunch_out_end" value={settings.lunch_out_end} onChange={handleChange} className="w-full mt-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-center font-bold dark:text-white tracking-widest" />
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">เข้างาน (บ่าย) ไม่เกิน</label>
              <input type="text" maxLength={5} placeholder="13:00" name="afternoon_in_end" value={settings.afternoon_in_end} onChange={handleChange} className="w-full mt-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-center font-bold dark:text-white tracking-widest" />
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">เลิกงานปกติ ไม่เกิน</label>
              <input type="text" maxLength={5} placeholder="17:00" name="evening_out_end" value={settings.evening_out_end} onChange={handleChange} className="w-full mt-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-center font-bold dark:text-white tracking-widest" />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-orange-50/30 dark:bg-orange-950/20">
          <h2 className="text-xl font-bold text-orange-800 dark:text-orange-400 mb-6 flex items-center gap-2">
            <Flame className="w-6 h-6" /> ตั้งค่าการทำ OT (แบบ 24 ชั่วโมง)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-orange-200 dark:border-orange-900/50 shadow-sm">
              <label className="block text-sm font-bold text-orange-700 dark:text-orange-400 mb-1">เวลาสแกนนิ้วเริ่ม OT</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">พนักงานต้องสแกน "เข้า OT" หลังเวลานี้</p>
              <input type="text" maxLength={5} placeholder="18:30" name="ot_in_end" value={settings.ot_in_end} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/50 rounded-lg outline-none text-center font-bold text-orange-700 dark:text-orange-400 tracking-widest" />
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button type="submit" disabled={isSaving || isLoading} className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-slate-800 dark:bg-indigo-600 dark:bg-indigo-500 hover:bg-slate-900 dark:hover:bg-indigo-700 shadow-sm">
            <Save className="w-5 h-5" /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </form>

      {/* --- New Shift Management Component --- */}
      <ShiftManager />
    </div>
  );
}