import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as xlsx from "xlsx";
import { getUserFromRequest } from '@/lib/auth-server';

export async function POST(request: Request) {
  const user: any = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // 🌟 อ่านเพื่อหาว่าหัวตารางอยู่บรรทัดไหน
    const rawMatrix = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
    let headerRowIndex = 0;
    for (let i = 0; i < rawMatrix.length; i++) {
      const rowString = rawMatrix[i].join("").toLowerCase();
      if (rowString.includes("วันที่") && rowString.includes("เวลา")) {
        headerRowIndex = i;
        break;
      }
    }

    // 🌟🌟 จุดที่แก้ปัญหาเรื่องวันที่! บังคับให้แปลง Date เป็น String ฟอร์แมต yyyy-mm-dd อัตโนมัติ
    const rawData = xlsx.utils.sheet_to_json(sheet, { 
      range: headerRowIndex, 
      defval: "", 
      raw: false,                 // บังคับแปลงค่าดิบให้เป็น Text (สำคัญมาก!)
      dateNF: "yyyy-mm-dd"        // ถ้าเป็นวันที่ ให้จัดฟอร์แมตนี้เลย
    });

    let successCount = 0;

    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, emp_code, fingerprint_id"); 

    if (empError) throw empError;
    if (!employees) throw new Error("ไม่สามารถดึงข้อมูลพนักงาน");

    for (const row of rawData as any[]) {
      const rawCode = row["หมายเลขพนักงาน"] || row["รหัส "] || row["รหัส"] || row[" รหัส"];
      const rawDate = row["วันที่"] || row["วันที่ "];
      const rawTime = row["เวลา"] || row["เวลา "];

      if (!rawCode || !rawDate || !rawTime) continue;

      const excelEmpCode = String(rawCode).trim().toLowerCase();
      const logDate = String(rawDate).trim(); 
      const timesString = String(rawTime).trim(); 

      const employee = employees.find((e) => {
        const dbFingerprint = String(e.fingerprint_id || "").trim().toLowerCase();
        return dbFingerprint === excelEmpCode;
      });
      
      if (!employee) continue;

      const times = timesString.split(",").map((t: string) => t.trim());
      const time_in_1 = times[0] || null;
      const time_out_1 = times[1] || null;
      const time_in_2 = times[2] || null;
      const time_out_2 = times[3] || null;
      const time_in_3 = times[4] || null; 
      const time_out_3 = times[5] || null; 

      // 🌟 ซ่อมแซมวันที่ (เผื่อมันยังหลุดมาเป็นฟอร์แมตที่มีทับ /)
      let formattedDate = logDate;
      if (logDate.includes("/")) {
        const parts = logDate.split("/");
        if (parts.length === 3) {
          let year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          let month = parts[0].padStart(2, '0');
          let day = parts[1].padStart(2, '0');
          if (Number(month) > 12) { // สลับวันกับเดือน กรณีมันมาเป็น DD/MM/YYYY
            const temp = month; month = day; day = temp;
          }
          formattedDate = `${year}-${month}-${day}`;
        }
      }

      // บันทึกลง Database
      const { error } = await supabase.from("attendance_logs").upsert(
        {
          employee_id: employee.id,
          log_date: formattedDate,
          time_in_1, time_out_1,
          time_in_2, time_out_2,
          time_in_3, time_out_3, 
        },
        { onConflict: "employee_id, log_date" },
      );

      // แจ้งเตือนใน Terminal ถ้าเกิด Error จะได้รู้สาเหตุ!
      if (error) {
        console.error(`❌ บันทึกไม่สำเร็จ รหัส: ${excelEmpCode} วันที่: ${formattedDate}`, error.message);
      } else {
        successCount++;
      }
    }

    return NextResponse.json({ success: true, count: successCount });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดจากระบบ" }, { status: 500 });
  }
}