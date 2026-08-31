'use client';
import React, { useState } from 'react';
import { BookOpen, Clock, FileText, UploadCloud, Users, Wallet, CalendarOff, Settings, GitCommit, Play, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ManualPage() {
  const [activeTab, setActiveTab] = useState<string>('workflow');

  const tabs = [
    { id: 'workflow', label: 'กระบวนการทำงาน (Workflow)', icon: GitCommit },
    { id: 'attendance', label: 'การลงเวลา & นำเข้า Excel', icon: Clock },
    { id: 'ot', label: 'การคิดเงิน & OT', icon: Wallet },
    { id: 'employees', label: 'พนักงาน & วันลา', icon: Users },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <BookOpen className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">คู่มือการใช้งานระบบ (User Manual)</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">คำแนะนำและวิธีใช้งานระบบ JST-INDUSTRY สำหรับฝ่ายบุคคลและฝ่ายเงินเดือน</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 min-h-[500px]">
        
        {activeTab === 'workflow' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* Workflow 1 */}
            <section>
              <h2 className="text-xl font-black flex items-center gap-2 text-slate-800 dark:text-white mb-6 border-b pb-2 dark:border-slate-700">
                <Play className="w-5 h-5 text-emerald-500" /> กระบวนการทำเงินเดือนประจำงวด (Payroll Workflow)
              </h2>
              <div className="space-y-0">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">1</div>
                    <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 my-2"></div>
                  </div>
                  <div className="pb-8 pt-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">เตรียมข้อมูลในเครื่องสแกนนิ้ว</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Export ข้อมูลจากเครื่องสแกนลายนิ้วมือออกมาเป็นไฟล์ Excel (.xlsx / .xls) ตามช่วงวันที่ต้องการตัดรอบเงินเดือน</p>
                  </div>
                </div>
                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">2</div>
                    <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 my-2"></div>
                  </div>
                  <div className="pb-8 pt-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">นำเข้าข้อมูล (Import Excel)</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">ไปที่เมนู <b>"จัดการเวลา (รายวัน)"</b> คลิด <b>"นำเข้า Excel"</b> ระบบจะกวาดข้อมูลเวลาเข้า-ออก ของพนักงานทุกคนที่รหัสตรงกันเข้าฐานข้อมูลอัตโนมัติ (นำเข้าทีละหลายวันได้เลย)</p>
                  </div>
                </div>
                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">3</div>
                    <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 my-2"></div>
                  </div>
                  <div className="pb-8 pt-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">ตรวจสอบและปรับปรุง (Review & Adjust)</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">ไปที่เมนู <b>"จัดการเวลา (รายบุคคล)"</b> ตรวจสอบพนักงานที่ลืมสแกนนิ้ว หรือมีโอทีพิเศษ/วันหยุดนักขัตฤกษ์ กรอก <b>ตัวคูณแรง (x1.5, x2.0)</b> หรือ <b>เงินเพิ่ม/หักเงิน</b> เป็นรายวัน</p>
                  </div>
                </div>
                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm"><CheckCircle2 className="w-5 h-5" /></div>
                  </div>
                  <div className="pb-2 pt-1">
                    <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-400">ออกรายงานและส่งจ่าย (Export Payroll)</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">ไปที่เมนู <b>"สรุปค่าจ้างและโอที"</b> เลือกช่วงวันที่ตัดรอบ ระบบจะคำนวณ <b>ค่าแรง + โอที + เงินเพิ่ม - หักเงิน = ยอดสุทธิ</b> ให้อัตโนมัติ กดปุ่ม Export Excel เพื่อนำไปส่งธนาคารหรือบัญชีได้เลย</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Workflow 2 */}
            <section>
              <h2 className="text-xl font-black flex items-center gap-2 text-slate-800 dark:text-white mb-6 border-b pb-2 dark:border-slate-700 mt-8">
                <Users className="w-5 h-5 text-blue-500" /> กระบวนการรับพนักงานใหม่เข้าระบบ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative">
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden md:block">
                    <ArrowRight className="text-slate-400" />
                  </div>
                  <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-2">1. ลงทะเบียนเครื่องสแกน</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">เก็บลายนิ้วมือพนักงานที่เครื่องสแกน และจด <b>"รหัสพนักงานในเครื่องสแกน" (Fingerprint ID)</b> ไว้</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 relative">
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden md:block">
                    <ArrowRight className="text-slate-400" />
                  </div>
                  <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-2">2. เพิ่มข้อมูลในระบบ</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">ไปที่ <b>ข้อมูลพนักงาน &gt; เพิ่มพนักงาน</b> กรอกชื่อ, แผนก, ค่าแรง/วัน, ค่า OT/ชม. และ <b>"รหัสเครื่องสแกนนิ้ว"</b> ให้ตรงกับข้อ 1</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-2">3. ผูกกะการทำงาน (ถ้ามี)</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">ไปที่แท็บ <b>ตั้งค่าข้อมูลการทำงาน</b> เลือกกะการทำงาน เพื่อให้ระบบรู้ว่าพนักงานคนนี้ต้องเริ่มคำนวณ OT ตั้งแต่เวลากี่โมง</p>
                </div>
              </div>
            </section>

          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <section>
              <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-700">
                <UploadCloud className="w-5 h-5 text-indigo-500" /> 1. การนำเข้าไฟล์ Excel
              </h2>
              <div className="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>ไปที่เมนู <b>จัดการเวลา (รายวัน)</b> และกดปุ่ม <b>"นำเข้า Excel"</b> ที่มุมขวาบน</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>ระบบรองรับไฟล์ Excel จากเครื่องสแกนนิ้ว (.xlsx, .xls)</li>
                  <li>สามารถอัปโหลดข้อมูล <b>หลายวันพร้อมกันได้</b> ระบบจะสรุปให้ดูว่าดึงข้อมูลของวันไหนมาบ้างและจำนวนกี่รายการ</li>
                  <li>ระบบจะจับคู่ข้อมูลผ่าน <b>"รหัสพนักงาน"</b> ใน Excel ให้ตรงกับในระบบ</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-700">
                <Clock className="w-5 h-5 text-emerald-500" /> 2. การจัดการเวลาและการตอกบัตร
              </h2>
              <div className="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>ระบบรองรับการลงเวลาได้ถึง <b>8 ช่อง (4 คู่)</b> เพื่อรองรับพนักงานที่ออกไปทำธุระ หรือรับลูกระหว่างวัน:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><b>เข้าเช้า - ออกเที่ยง - เข้าบ่าย - เลิกงาน :</b> เป็นเวลาทำงานปกติ</li>
                  <li><b>เข้า OT - ออก OT :</b> สำหรับการทำโอทีหลังเลิกงาน</li>
                  <li><b>เข้าพิเศษ (4) - ออกพิเศษ (4) :</b> สำหรับการเข้าออกนอกเวลา หรือธุระอื่นๆ</li>
                </ul>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg mt-4">
                  <p className="text-amber-800 dark:text-amber-400 font-medium">💡 <b>ทริคการลงย้อนหลัง:</b> คุณสามารถกดเปลี่ยนวันที่ เพื่อพิมพ์เพิ่มข้อมูลย้อนหลังด้วยตนเองได้เลย ระบบจะบันทึกประวัติไว้ป้องกันการทุจริต</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'ot' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <section>
              <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-700">
                <FileText className="w-5 h-5 text-indigo-500" /> 1. การคิดเงินปกติ และวันหยุด
              </h2>
              <div className="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                <ul className="list-disc pl-6 space-y-2">
                  <li>ระบบจะนับว่าพนักงาน "มาทำงาน" ก็ต่อเมื่อมีเวลา <b>เข้าเช้า</b></li>
                  <li>หากเป็นวันหยุด คุณสามารถปรับช่อง <b>"อัตราค่าแรง"</b> ในหน้าจัดการเวลาให้เป็น <b>x2.0</b> ได้ เพื่อให้วันนั้นพนักงานได้เงินสองแรง</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-700">
                <Wallet className="w-5 h-5 text-orange-500" /> 2. การคำนวณ OT และตัวคูณพิเศษ
              </h2>
              <div className="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                <ul className="list-disc pl-6 space-y-2">
                  <li>ระบบจะเริ่มนับชั่วโมง OT ให้อัตโนมัติเมื่อพนักงานลงเวลาออก <b>เกินกว่า "เวลาเริ่ม OT"</b> ที่ตั้งไว้ใน "ตั้งค่าระบบ" (เช่น หลัง 18:30 น.)</li>
                  <li>คุณสามารถปรับ <b>"ตัวคูณ OT"</b> ในหน้าจัดการเวลา (ค่าเริ่มต้น x1.0) หากเป็นวันหยุดนักขัตฤกษ์ สามารถปรับเป็น <b>x3.0</b> ได้ เพื่อให้ชั่วโมง OT ในวันนั้นนำไปคูณ 3 อัตโนมัติ</li>
                </ul>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 rounded-r-lg mt-4">
                  <p className="text-emerald-800 dark:text-emerald-400 font-medium">💡 <b>เงินเพิ่ม / หักเงิน:</b> หากพนักงานมาทำงานรอบเช้า (ก่อน 8 โมง) ระบบจะไม่คิด OT ให้อัตโนมัติ แต่คุณสามารถกรอกเงินชดเชยผ่านช่อง <b>"เงินเพิ่ม"</b> (บวกเพิ่ม) หรือ <b>"หักเงิน"</b> ได้เป็นรายวันเลย</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <section>
              <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-700">
                <Users className="w-5 h-5 text-blue-500" /> 1. การเพิ่มและแก้ไขข้อมูลพนักงาน
              </h2>
              <div className="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>ไปที่เมนู <b>ข้อมูลพนักงาน</b></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><b>รหัสเครื่องสแกนนิ้ว:</b> สำคัญมาก ต้องตรงกับใน Excel เพิ่อให้ข้อมูลเชื่อมกันได้</li>
                  <li><b>ค่าแรง/วัน:</b> ใช้สำหรับคิดเงินรวมในหน้าสรุปรายงาน</li>
                  <li><b>ค่า OT/ชม.:</b> ใช้สำหรับคูณจำนวนชั่วโมง OT (ส่วนใหญ่จะคำนวณ x1.5 มาให้แล้วจากฐานเงินเดือน)</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-700">
                <CalendarOff className="w-5 h-5 text-rose-500" /> 2. การอนุมัติการลา
              </h2>
              <div className="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>ไปที่เมนู <b>อนุมัติการลา</b></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>คุณสามารถเลือกอนุมัติ หรือปฏิเสธคำขอลาของพนักงานได้</li>
                  <li>หาก "อนุมัติ" ข้อมูลจะถูกบันทึกลงในสถิติของพนักงาน และสามารถนำไปประกอบการคิดเงินเดือน หรือประเมินผลได้</li>
                </ul>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  );
}
