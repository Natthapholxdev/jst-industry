'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud } from 'lucide-react';
import Swal from 'sweetalert2';

interface FileUploadProps {
  onSuccess?: () => void;
}

export default function FileUpload({ onSuccess }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const router = useRouter();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadStatus('กำลังอ่านไฟล์ Excel...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล', 'error');
        setIsUploading(false);
        return;
      }

      if (!response.body) return;
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        
        for (const part of parts) {
          if (part.startsWith('data: ')) {
            try {
              const data = JSON.parse(part.substring(6));
              if (data.type === 'progress') {
                setUploadStatus(`กำลังบันทึก: ${data.employee} (${data.date})`);
              } else if (data.type === 'done') {
                // Prepare HTML summary by date
                let summaryHtml = '<div class="text-left mt-3 max-h-40 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50 text-sm">';
                if (data.summary && Object.keys(data.summary).length > 0) {
                  summaryHtml += '<b>สรุปข้อมูลที่นำเข้าตามวันที่:</b><ul class="list-disc pl-5 mt-2">';
                  Object.entries(data.summary)
                    .sort(([a], [b]) => a.localeCompare(b)) // Sort dates chronologically
                    .forEach(([dateStr, count]) => {
                      summaryHtml += `<li>วันที่ ${dateStr} : <b>${count}</b> รายการ</li>`;
                    });
                  summaryHtml += '</ul>';
                }
                summaryHtml += '</div>';

                Swal.fire({
                  icon: 'success',
                  title: 'นำเข้าข้อมูลสำเร็จ!',
                  html: `บันทึกข้อมูลทั้งหมด <b>${data.count}</b> รายการ${summaryHtml}`,
                  confirmButtonColor: '#4f46e5'
                }).then(() => {
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    router.refresh(); 
                  }
                });
              } else if (data.error) {
                Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาด: ' + data.error, 'error');
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อระบบได้', 'error');
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        type="file" id="excel-upload" accept=".xlsx, .xls"
        className="hidden" onChange={handleFileChange} disabled={isUploading}
      />
      <label
        htmlFor="excel-upload"
        className={`cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition shadow-sm border ${
          isUploading 
            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
        }`}
      >
        {isUploading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            กำลังอัปโหลด...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5" /> นำเข้า Excel
          </span>
        )}
      </label>
      {uploadStatus && (
        <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 animate-pulse mt-1">
          {uploadStatus}
        </div>
      )}
    </div>
  );
}
