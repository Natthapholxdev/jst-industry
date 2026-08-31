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
      .select("id, emp_code, full_name, weekly_day_off")
      .eq("status", "Active")
      .order("emp_code", { ascending: true });
    if (empError) throw empError;

    const { data: logs, error: logError } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("log_date", date);
    if (logError) throw logError;

    // หาว่าเป็นวันหยุดบริษัทหรือไม่
    const { data: holidays } = await supabase
      .from("holidays")
      .select("*")
      .eq("holiday_date", date);
    
    const holiday = holidays && holidays.length > 0 ? holidays[0] : null;
    const currentDayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday...

    const records = employees.map((emp) => {
      const log = logs?.find((l) => l.employee_id === emp.id);
      
      // การคำนวณ Multiplier เริ่มต้น
      let defaultMultiplier = 1.0;
      if (holiday) {
        defaultMultiplier = holiday.multiplier || 2.0;
      } else if (emp.weekly_day_off !== null && emp.weekly_day_off !== undefined && emp.weekly_day_off === currentDayOfWeek) {
        defaultMultiplier = 2.0;
      }

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
        time_in_4: log?.time_in_4 || "",
        time_out_4: log?.time_out_4 || "",
        remark: log?.remark || "",
        pay_multiplier: log?.pay_multiplier ?? defaultMultiplier,
        ot_multiplier: log?.ot_multiplier ?? 1.0,
        extra_add: log?.extra_add ?? 0,
        extra_deduct: log?.extra_deduct ?? 0,
        is_holiday: !!holiday,
        holiday_name: holiday?.name || "",
        is_weekly_day_off: emp.weekly_day_off === currentDayOfWeek
      };
    });

    return NextResponse.json({ records, isHoliday: !!holiday, holidayInfo: holiday });
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
      "time_in_4",
      "time_out_4",
      "remark",
      "pay_multiplier",
      "ot_multiplier",
      "extra_add",
      "extra_deduct"
    ];

    // 2. เตรียมข้อมูลสำหรับบันทึก และเช็คว่ามีการแก้ช่องไหนบ้าง
    const payload = records.map((rec: any) => {
      const oldLog = existingLogs?.find((l) => l.employee_id === rec.id);

      // ตรวจสอบทีละช่องว่าค่าเปลี่ยนไปจากเดิมไหม
      fieldsToCheck.forEach((field) => {
        // จัดการให้ค่าว่าง ('') เป็น null จะได้เทียบกันได้เป๊ะๆ
        let oldVal = oldLog ? oldLog[field] : null;
        if (oldVal === undefined) oldVal = null;
        let newVal = rec[field];
        if (newVal === undefined || newVal === "") newVal = null;

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
        time_in_4: rec.time_in_4 || null,
        time_out_4: rec.time_out_4 || null,
        remark: rec.remark || null,
        pay_multiplier: rec.pay_multiplier !== undefined ? Number(rec.pay_multiplier) : 1.0,
        ot_multiplier: rec.ot_multiplier !== undefined ? Number(rec.ot_multiplier) : 1.0,
        extra_add: rec.extra_add !== undefined ? Number(rec.extra_add) : 0,
        extra_deduct: rec.extra_deduct !== undefined ? Number(rec.extra_deduct) : 0
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
