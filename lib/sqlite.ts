import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');

export async function getDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // รันคำสั่ง SQL สร้างตารางทั้งหมด (ห้ามใช้เครื่องหมาย // ในบล็อกนี้เด็ดขาด)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        emp_code TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        department TEXT,
        position TEXT,
        phone_number TEXT,
        email TEXT,
        hire_date DATE,
        base_salary NUMERIC,
        status TEXT DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        log_date DATE NOT NULL,
        time_in_1 TIME,
        time_out_1 TIME,
        time_in_2 TIME,
        time_out_2 TIME,
        work_hours NUMERIC,
        overtime_hours NUMERIC,
        status_code TEXT,
        remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(employee_id) REFERENCES employees(id),
        UNIQUE(employee_id, log_date)
    );

    CREATE TABLE IF NOT EXISTS shift_settings (
        id INTEGER PRIMARY KEY,
        shift_name TEXT DEFAULT 'กะปกติ (Normal)',
        prevent_double_scan_mins INTEGER DEFAULT 10,
        morning_in_end TIME DEFAULT '10:30',
        lunch_out_end TIME DEFAULT '12:30',
        afternoon_in_end TIME DEFAULT '14:00',
        evening_out_end TIME DEFAULT '17:30',
        ot_in_end TIME DEFAULT '18:30'
    );

    INSERT OR IGNORE INTO shift_settings 
    (id, shift_name, prevent_double_scan_mins, morning_in_end, lunch_out_end, afternoon_in_end, evening_out_end, ot_in_end) 
    VALUES 
    (1, 'กะปกติ (Normal)', 10, '10:30', '12:30', '14:00', '17:30', '18:30');

    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- บังคับสร้างรหัสผ่านแอดมินเป็น 243044
    INSERT INTO admins (id, username, password_hash) 
    VALUES (1, 'admin', '243044')
    ON CONFLICT(id) DO UPDATE SET password_hash = '243044';
  `);

  return db;
}