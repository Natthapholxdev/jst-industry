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

          const buckets = { E0: [] as string[], E1: [] as string[], E2: [] as string[], E3: [] as string[], E4: [] as string[], E5: [] as string[] };
          
          rawTimes.forEach((t: string) => {
            const val = timeToHours(t);
            // 08:00 - 12:00 Morning, 13:00 - 17:00 Afternoon, 18:00+ OT
            if (val < 10.5) buckets.E0.push(t); // Morning In (Target 08:00)
            else if (val < 12.5) buckets.E1.push(t); // Morning Out (Target 12:00)
            else if (val < 14.5) buckets.E2.push(t); // Afternoon In (Target 13:00)
            else if (val < 17.5) buckets.E3.push(t); // Afternoon Out (Target 17:00)
            else if (val < 18.5) buckets.E4.push(t); // OT In (Target 18:00)
            else buckets.E5.push(t); // OT Out
          });

          let time_in_1 = buckets.E0.length > 0 ? buckets.E0[0] : null;
          let time_out_1 = buckets.E1.length > 0 ? buckets.E1[buckets.E1.length - 1] : null;
          let time_in_2 = buckets.E2.length > 0 ? buckets.E2[0] : null;
          let time_out_2 = buckets.E3.length > 0 ? buckets.E3[buckets.E3.length - 1] : null;
          let time_in_3 = buckets.E4.length > 0 ? buckets.E4[0] : null;
          let time_out_3 = buckets.E5.length > 0 ? buckets.E5[buckets.E5.length - 1] : null;
          let time_in_4 = null;
          let time_out_4 = null;

          // Fixup logic to maintain contiguous pairs for OT calculation
          // If a scan falls into OT In, but there is no OT Out, it's actually their final Out scan!
          if (time_in_3 && !time_out_3) {
             time_out_3 = time_in_3;
             time_in_3 = null;
          }
          
          // If they have an Out scan but the corresponding In scan is missing, 
          // we shift the Out scan back to complete the previous pair if possible.
          if (time_out_3 && !time_in_3) {
            if (time_out_2) {
              // Both out2 and out3 exist, but in3 is missing.
              // Example: [17:00, 19:25]. 17:00 is out2, 19:25 is out3.
              // Just replace out2 with out3 so their shift ends at 19:25!
              time_out_2 = time_out_3;
              time_out_3 = null;
            } else if (time_in_2) {
              // out2 is missing, but in2 exists.
              // Just move out3 to out2.
              time_out_2 = time_out_3;
              time_out_3 = null;
            } else if (time_out_1) {
              // in2 and out2 are missing.
              time_out_1 = time_out_3;
              time_out_3 = null;
            } else if (time_in_1) {
              time_out_1 = time_out_3;
              time_out_3 = null;
            }
          }
          
          if (time_out_2 && !time_in_2) {
            if (time_out_1) {
              time_out_1 = time_out_2;
              time_out_2 = null;
            } else if (time_in_1) {
              time_out_1 = time_out_2;
              time_out_2 = null;
            }
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