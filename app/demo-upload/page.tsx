"use client";
import { useState } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import Swal from "sweetalert2";

export default function DemoUploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-demo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        Swal.fire("ข้อผิดพลาด", data.error || "เกิดข้อผิดพลาดในการตรวจสอบ", "error");
      } else {
        setResult(data);
        Swal.fire("สำเร็จ", "ตรวจสอบไฟล์เสร็จสิ้น (ไม่ได้บันทึกลงฐานข้อมูล)", "success");
      }
    } catch (error) {
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อระบบได้", "error");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto font-sans">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          ทดสอบนำเข้าข้อมูล (Demo Upload)
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          หน้านี้ใช้สำหรับทดสอบนำเข้าไฟล์ Excel เพื่อตรวจสอบการอ่านข้อมูล "ช่องพิเศษ" 
          โดยจะไม่มีการบันทึกข้อมูลลงฐานข้อมูลจริง เพื่อป้องกันผลกระทบกับข้อมูลที่ใช้งานอยู่
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 bg-slate-50 dark:bg-slate-900">
          <UploadCloud className="w-12 h-12 text-indigo-500 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">อัปโหลดไฟล์ Excel เพื่อทดสอบ</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">
            รองรับไฟล์ .xlsx หรือ .xls จากเครื่องสแกนหน้า
          </p>
          
          <input
            type="file"
            id="demo-excel-upload"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <label
            htmlFor="demo-excel-upload"
            className={`cursor-pointer px-6 py-2.5 rounded-lg font-bold transition shadow-sm border ${
              isUploading
                ? "bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
            }`}
          >
            {isUploading ? "กำลังตรวจสอบ..." : "เลือกไฟล์ Excel"}
          </label>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-indigo-500 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><UploadCloud /></div>
              <div>
                <p className="text-sm text-slate-500 font-semibold">จำนวนแถวทั้งหมด</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{result.totalRawRows}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-emerald-500 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle /></div>
              <div>
                <p className="text-sm text-slate-500 font-semibold">อ่านข้อมูลสำเร็จ</p>
                <p className="text-2xl font-bold text-emerald-600">{result.parsedCount}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-amber-500 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle /></div>
              <div>
                <p className="text-sm text-slate-500 font-semibold">ข้าม (ข้อมูลไม่ครบ)</p>
                <p className="text-2xl font-bold text-amber-600">{result.skippedCount}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-rose-500 flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><XCircle /></div>
              <div>
                <p className="text-sm text-slate-500 font-semibold">ไม่พบรหัสพนักงาน</p>
                <p className="text-2xl font-bold text-rose-600">{result.unmappedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h2 className="font-bold text-slate-700 dark:text-slate-200">ตัวอย่างข้อมูลที่อ่านได้ (5 รายการแรก)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="px-4 py-3">พนักงาน</th>
                    <th className="px-4 py-3">วันที่</th>
                    <th className="px-4 py-3">เวลาดิบ (จาก Excel)</th>
                    <th className="px-4 py-3 border-l text-center">เข้าเช้า</th>
                    <th className="px-4 py-3 text-center">ออกเที่ยง</th>
                    <th className="px-4 py-3 text-center">เข้าบ่าย</th>
                    <th className="px-4 py-3 text-center">เลิกงาน</th>
                    <th className="px-4 py-3 text-center">เข้า OT</th>
                    <th className="px-4 py-3 text-center">ออก OT</th>
                    <th className="px-4 py-3 border-l text-indigo-600 text-center">เข้าพิเศษ (4)</th>
                    <th className="px-4 py-3 text-indigo-600 text-center">ออกพิเศษ (4)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {result.parsedResults.slice(0, 5).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium">{row.employee} <br/><span className="text-xs text-slate-400">({row.fingerprint_id})</span></td>
                      <td className="px-4 py-3">{row.log_date}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 break-all max-w-xs">{row.times.join(", ")}</td>
                      <td className="px-4 py-3 border-l text-center">{row.parsed_times.time_in_1 || "-"}</td>
                      <td className="px-4 py-3 text-center">{row.parsed_times.time_out_1 || "-"}</td>
                      <td className="px-4 py-3 text-center">{row.parsed_times.time_in_2 || "-"}</td>
                      <td className="px-4 py-3 text-center">{row.parsed_times.time_out_2 || "-"}</td>
                      <td className="px-4 py-3 text-center">{row.parsed_times.time_in_3 || "-"}</td>
                      <td className="px-4 py-3 text-center">{row.parsed_times.time_out_3 || "-"}</td>
                      <td className="px-4 py-3 border-l text-center font-bold text-indigo-600 bg-indigo-50/30">{row.parsed_times.time_in_4 || "-"}</td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-600 bg-indigo-50/30">{row.parsed_times.time_out_4 || "-"}</td>
                    </tr>
                  ))}
                  {result.parsedResults.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-slate-500">ไม่มีข้อมูลที่อ่านได้สำเร็จ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {result.unmappedEmployees.length > 0 && (
             <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <h3 className="font-bold text-rose-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> รหัสที่ไม่พบในระบบ (Unmapped)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(result.unmappedEmployees.map((e:any) => e.code))).map((code: any, i) => (
                    <span key={i} className="px-2 py-1 bg-white text-rose-600 border border-rose-200 rounded text-sm font-medium">
                      {code}
                    </span>
                  ))}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
