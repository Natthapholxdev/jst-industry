import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth-server";

export async function GET(request: Request) {
  // ตรวจสอบสิทธิ์ (Auth check)
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date)
    return NextResponse.json({ error: "Date is required" }, { status: 400 });

  try {
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, emp_code, full_name")
      .eq("status", "Active")
      .order("emp_code", { ascending: true });
    if (empError) throw empError;

    const { data: logs, error: logError } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("log_date", date);
    if (logError) throw logError;

    const records = employees.map((emp) => {
      const log = logs?.find((l) => l.employee_id === emp.id);
      return {
        id: emp.id,
        emp_code: emp.emp_code,
        full_name: emp.full_name,
        time_in_1: log?.time_in_1 || "",
        time_out_1: log?.time_out_1 || "",
        time_in_2: log?.time_in_2 || "",
        time_out_2: log?.time_out_2 || "",
        time_in_3: log?.time_in_3 || "",
        time_out_3: log?.time_out_3 || "",
        remark: log?.remark || "",
      };
    });

    return NextResponse.json(records);
  } catch (error: any) {
    // ป้องกัน Information Exposure: ไม่ส่งรายละเอียดของ error กลับไปยัง client
    console.error("API Error (Attendance GET):", error);
    return NextResponse.json(
      {
        error: "เกิดข้อผิดพลาดจากระบบ",
      },
      { status: 500 },
    );
  }
}

// 🌟 ฟังก์ชัน POST ใหม่ ที่มีระบบบันทึก Audit Log
export async function POST(request: Request) {
  // ตรวจสอบสิทธิ์ (Auth check)
  const user: any = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { date, records } = await request.json();

    // 1. ดึงข้อมูลเดิมจากฐานข้อมูลมาก่อน เพื่อเอามาเปรียบเทียบ
    const { data: existingLogs } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("log_date", date);

    const auditPayload: any[] = [];
    const fieldsToCheck = [
      "time_in_1",
      "time_out_1",
      "time_in_2",
      "time_out_2",
      "time_in_3",
      "time_out_3",
      "remark",
    ];

    // 2. เตรียมข้อมูลสำหรับบันทึก และเช็คว่ามีการแก้ช่องไหนบ้าง
    const payload = records.map((rec: any) => {
      const oldLog = existingLogs?.find((l) => l.employee_id === rec.id);

      // ตรวจสอบทีละช่องว่าค่าเปลี่ยนไปจากเดิมไหม
      fieldsToCheck.forEach((field) => {
        // จัดการให้ค่าว่าง ('') เป็น null จะได้เทียบกันได้เป๊ะๆ
        const oldVal = oldLog ? oldLog[field] || null : null;
        const newVal = rec[field] || null;

        // ถ้าค่าไม่ตรงกัน แปลว่ามีการแก้ไข (หรือเพิ่มใหม่)
        if (oldVal !== newVal) {
          auditPayload.push({
            employee_id: rec.id,
            log_date: date,
            field_name: field,
            old_value: oldVal ? oldVal.toString() : "-",
            new_value: newVal ? newVal.toString() : "-",
            modified_by: user.id // บันทึกว่าใครเป็นคนแก้ (admin id)
          });
        }
      });

      return {
        employee_id: rec.id,
        log_date: date,
        time_in_1: rec.time_in_1 || null,
        time_out_1: rec.time_out_1 || null,
        time_in_2: rec.time_in_2 || null,
        time_out_2: rec.time_out_2 || null,
        time_in_3: rec.time_in_3 || null,
        time_out_3: rec.time_out_3 || null,
        remark: rec.remark || null,
      };
    });

    // 3. บันทึกข้อมูลเวลาเข้าตารางปกติ
    const { error: upsertError } = await supabase
      .from("attendance_logs")
      .upsert(payload, { onConflict: "employee_id, log_date" });

    if (upsertError) throw upsertError;

    // 4. บันทึกประวัติการแก้ไขลงตาราง Audit (ถ้ามีการแก้)
    if (auditPayload.length > 0) {
      await supabase.from("attendance_audit_logs").insert(auditPayload);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Attendance Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดจากระบบ" }, { status: 500 });
  }
}
