'use client';
import { useState, useEffect } from 'react';

// สร้างอาเรย์สำหรับชั่วโมง และ นาที
const pad = (n: number) => n.toString().padStart(2, '0');
const hoursList = Array.from({ length: 24 }, (_, i) => pad(i));

// นาทีเราจะแสดงทีละ 1 นาทีให้ครบ 60 ตัวเพื่อความละเอียด แต่ออกแบบ UI ให้กดง่าย
const minutesList = Array.from({ length: 60 }, (_, i) => pad(i));

export default function TimePickerModal({ 
  isOpen, onClose, initialTime, onSave, title 
}: { 
  isOpen: boolean, onClose: () => void, initialTime: string, onSave: (time: string) => void, title: string 
}) {
  const [activeTab, setActiveTab] = useState<'hour' | 'minute' | 'second'>('hour');
  
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');
  const [second, setSecond] = useState('00');

  useEffect(() => {
    if (isOpen) {
      const [newH, newM, newS] = (initialTime && initialTime !== '-' ? initialTime : '08:00:00').split(':');
      setHour(newH || '08');
      setMinute(newM || '00');
      setSecond(newS || '00');
      setActiveTab('hour'); // เปิดมาให้เลือกชั่วโมงก่อนเสมอ
    }
  }, [isOpen, initialTime]);

  if (!isOpen) return null;

  // จัดการเมื่อกดเลือกเวลา
  const handleSelect = (type: 'hour' | 'minute' | 'second', value: string) => {
    if (type === 'hour') {
      setHour(value);
      setActiveTab('minute'); // เลือกชั่วโมงเสร็จ เด้งไปหน้านาทีออโต้
    } else if (type === 'minute') {
      setMinute(value);
      setActiveTab('second'); // เลือกนาทีเสร็จ เด้งไปหน้าวินาทีออโต้
    } else {
      setSecond(value);
      // เลือกครบแล้วไม่ปิดออโต้ เผื่ออยากแก้ ให้ผู้ใช้กดปุ่ม 'บันทึก' เอง
    }
  };

  const handleSave = () => {
    onSave(`${hour}:${minute}:${second}`);
    onClose();
  };

  const handleClear = () => {
    onSave('-');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800 text-white flex justify-between items-center">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl leading-none">&times;</button>
        </div>
        
        <div className="p-5">
          {/* ส่วนแสดงเวลาที่เลือก */}
          <div className="flex justify-center items-center gap-2 mb-6">
            <button onClick={() => setActiveTab('hour')} className={`text-4xl font-black rounded-lg px-2 py-1 transition ${activeTab === 'hour' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800/50'}`}>
              {hour}
            </button>
            <span className="text-3xl font-bold text-slate-300">:</span>
            <button onClick={() => setActiveTab('minute')} className={`text-4xl font-black rounded-lg px-2 py-1 transition ${activeTab === 'minute' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800/50'}`}>
              {minute}
            </button>
            <span className="text-3xl font-bold text-slate-300">:</span>
            <button onClick={() => setActiveTab('second')} className={`text-4xl font-black rounded-lg px-2 py-1 transition ${activeTab === 'second' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800/50'}`}>
              {second}
            </button>
          </div>

          {/* Grid เลือกตัวเลข */}
          <div className="h-48 overflow-y-auto pr-2 custom-scrollbar">
            
            {activeTab === 'hour' && (
              <div className="grid grid-cols-4 gap-2">
                {hoursList.map(h => (
                  <button 
                    key={h} onClick={() => handleSelect('hour', h)}
                    className={`py-2 rounded-lg text-lg font-bold transition-all border 
                      ${hour === h ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 shadow-md scale-105' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 bborder-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'minute' && (
              <div className="grid grid-cols-6 gap-2">
                {minutesList.map(m => (
                  <button 
                    key={m} onClick={() => handleSelect('minute', m)}
                    className={`py-1.5 rounded-md text-sm font-bold transition-all border 
                      ${minute === m ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 shadow-md scale-110 z-10' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 bborder-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'second' && (
              <div className="grid grid-cols-6 gap-2">
                {minutesList.map(s => (
                  <button 
                    key={s} onClick={() => handleSelect('second', s)}
                    className={`py-1.5 rounded-md text-sm font-bold transition-all border 
                      ${second === s ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 shadow-md scale-110 z-10' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 bborder-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* ปุ่มควบคุม */}
          <div className="mt-6 flex gap-3 pt-4 border-t bborder-slate-100 dark:border-slate-700/50">
            <button onClick={handleClear} className="px-4 py-2.5 bg-white dark:bg-slate-800 text-rose-500 border border-rose-200 hover:bg-rose-50 font-bold text-sm rounded-xl transition w-1/3">
              ล้างค่า
            </button>
            <button onClick={handleSave} className="px-4 py-2.5 bg-slate-800 text-white hover:bg-slate-900 font-bold text-sm rounded-xl transition shadow-sm w-2/3">
              บันทึกเวลา
            </button>
          </div>
        </div>
        
      </div>

      {/* สไตล์สำหรับ Scrollbar ให้ดูเล็กและสวยขึ้น */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}