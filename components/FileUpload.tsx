'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FileUploadProps {
  onSuccess?: () => void;
}

export default function FileUpload({ onSuccess }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();

      if (response.ok) {
        alert(`นำเข้าข้อมูลสำเร็จ! บันทึกไปทั้งหมด ${result.count} รายการ`);
        if (onSuccess) {
          onSuccess(); // เรียก function รีเฟรชข้อมูลของ Component แม่
        } else {
          router.refresh(); 
        }
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (error) {
      alert('ไม่สามารถเชื่อมต่อระบบได้');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // เคลียร์ช่องเลือกไฟล์
    }
  };

  return (
    <div>
      <input
        type="file" id="excel-upload" accept=".xlsx, .xls"
        className="hidden" onChange={handleFileChange} disabled={isUploading}
      />
      <label
        htmlFor="excel-upload"
        className={`cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition shadow-sm border ${
          isUploading 
            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 bborder-slate-200 dark:border-slate-700 cursor-not-allowed' 
            : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-800'
        }`}
      >
        {isUploading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            กำลังอัปโหลด...
          </span>
        ) : (
          '📥 นำเข้า Excel'
        )}
      </label>
    </div>
  );
}
