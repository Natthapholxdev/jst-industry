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

    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, emp_code, fingerprint_id, full_name"); 

    if (empError) throw empError;
    if (!employees) throw new Error("ไม่สามารถดึงข้อมูลพนักงาน");

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        let successCount = 0;
        let dateCounts: Record<string, number> = {};

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

          const rawTimes = timesString.split(",").map((t: string) => t.trim()).filter(Boolean).sort();
          
          const timeToHours = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h + (m / 60);
          };

          const buckets = { Morning: [] as string[], Lunch: [] as string[], Evening: [] as string[], OT: [] as string[] };
          
          rawTimes.forEach((t: string) => {
            const val = timeToHours(t);
            if (val < 10.5) buckets.Morning.push(t);
            else if (val >= 10.5 && val < 14.5) buckets.Lunch.push(t);
            else if (val >= 14.5 && val < 17.75) buckets.Evening.push(t); // up to 17:45
            else buckets.OT.push(t);
          });

          let time_in_1 = buckets.Morning.length > 0 ? buckets.Morning[0] : null;
          let time_out_1 = buckets.Lunch.length > 0 ? buckets.Lunch[0] : null;
          let time_in_2 = buckets.Lunch.length >= 2 ? buckets.Lunch[buckets.Lunch.length - 1] : null;
          let time_out_2 = buckets.Evening.length > 0 ? buckets.Evening[buckets.Evening.length - 1] : null;
          let time_in_3 = buckets.OT.length > 0 ? buckets.OT[0] : null;
          let time_out_3 = buckets.OT.length >= 2 ? buckets.OT[buckets.OT.length - 1] : null;
          let time_in_4 = null;
          let time_out_4 = null;

          // Fix trailing IN scan for OT
          if (time_in_3 && !time_out_3) {
             time_out_3 = time_in_3;
             time_in_3 = null;
          }

          // 🌟 ซ่อมแซมวันที่ (ในไทยส่วนใหญ่ใช้ DD/MM/YYYY)
          let formattedDate = logDate;
          if (logDate.includes("/")) {
            const parts = logDate.split("/");
            if (parts.length === 3) {
              let year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              let day = parts[0].padStart(2, '0');
              let month = parts[1].padStart(2, '0');
              if (Number(month) > 12) { // สลับวันกับเดือน กรณีมันมาเป็น MM/DD/YYYY
                const temp = month; month = day; day = temp;
              }
              formattedDate = `${year}-${month}-${day}`;
            }
          }

          // ส่ง Progress แบบ Real-time
          sendEvent({ type: 'progress', employee: employee.full_name, date: formattedDate });

          // บันทึกลง Database
          const { error } = await supabase.from("attendance_logs").upsert(
            {
              employee_id: employee.id,
              log_date: formattedDate,
              time_in_1, time_out_1,
              time_in_2, time_out_2,
              time_in_3, time_out_3,
              time_in_4, time_out_4
            },
            { onConflict: "employee_id, log_date" },
          );

          if (!error) {
            successCount++;
            dateCounts[formattedDate] = (dateCounts[formattedDate] || 0) + 1;
          }
        }
        
        sendEvent({ type: 'done', count: successCount, summary: dateCounts });
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดจากระบบ" }, { status: 500 });
  }
}