const fs = require('fs');
let f = fs.readFileSync('app/(admin)/dashboard/page.tsx', 'utf8');

// 1. Add "Live Control" tab state definition
// Wait, the state `activeTab` is defined as: const [activeTab, setActiveTab] = useState<'overview' | 'symbol' | 'detailed'>('overview');
f = f.replace(
  "useState<'overview' | 'symbol' | 'detailed'>('overview');",
  "useState<'overview' | 'symbol' | 'detailed' | 'liveControl'>('overview');"
);

// 2. Add the Tab Button
const newTabHtml = `
        <button 
          onClick={() => setActiveTab('liveControl')}
          className={\`px-4 py-2.5 font-bold text-sm rounded-t-[12px] transition flex items-center gap-2 whitespace-nowrap
            \${activeTab === 'liveControl' ? 'text-[var(--apple-text-primary)] border-b-[3px] border-apple-blue' : 'text-[var(--apple-text-secondary)] hover:bg-black/5 dark:hover:bg-white/10'}\`}
        >
          <Cast className="w-4 h-4" /> จัดการหน้าจอนำเสนอ
        </button>
      </div>`;

f = f.replace(
  "รายงานแบบเวลาละเอียด\n        </button>\n      </div>",
  "รายงานแบบเวลาละเอียด\n        </button>\n" + newTabHtml
);

// 3. Add the Live Control Content
const liveControlContent = `
      {activeTab === 'liveControl' && (
        <div className="bg-white dark:bg-black/20 rounded-[24px] shadow-[var(--shadow-apple-soft)] border border-slate-200 dark:border-slate-800 p-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Left: Controls */}
            <div className="flex-1">
              <h2 className="text-xl font-extrabold text-[var(--apple-text-primary)] mb-2">เลือกข้อมูลที่ต้องการนำเสนอ</h2>
              <p className="text-[var(--apple-text-secondary)] mb-6 text-sm">ข้อมูลจะถูกส่งไปยังหน้าจอ Public ทันทีที่กดปุ่มนำเสนอ</p>
              
              <div className="space-y-4">
                {/* Option 1: Executive Chart */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--apple-text-primary)]">กราฟสรุปการเข้างาน</h3>
                      <p className="text-xs text-[var(--apple-text-secondary)] mt-0.5">กราฟสรุปพฤติกรรมการมาทำงาน, ลา, มาสาย</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => startPresentation('executive', 'วิเคราะห์พฤติกรรมการลงเวลา', { chartData, dateRangeType, customStart, customEnd })}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
                  >
                    นำเสนอกราฟนี้
                  </button>
                </div>

                {/* Option 2: Late Board */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--apple-text-primary)]">กระดานคนมาสาย / ลืมสแกน</h3>
                      <p className="text-xs text-[var(--apple-text-secondary)] mt-0.5">โชว์รายชื่อบนทีวี เพื่อให้พนักงานรีบแจ้ง HR</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const latesAndMissing = tableEmployees.filter(emp => emp.isMissingPunch || emp.todayStatus.includes('ลา') || emp.todayStatus.includes('ลืม'));
                      startPresentation('late-board', 'กระดานแจ้งเตือน: ลืมสแกน / มาสาย', { employees: latesAndMissing, date: new Date().toISOString().split('T')[0] })
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
                  >
                    นำเสนอกระดานนี้
                  </button>
                </div>

                {/* Option 3: Department Stats */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--apple-text-primary)]">สถิติความตื่นตัวรายแผนก</h3>
                      <p className="text-xs text-[var(--apple-text-secondary)] mt-0.5">เทียบเปอร์เซ็นต์มาทำงานของแต่ละแผนก (Leaderboard)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      // Group stats by department
                      const deptStats = departments.map(d => {
                        const emps = tableEmployees.filter(e => e.departments?.name_th === d.name_th);
                        const present = emps.filter(e => e.todayStatus === 'เข้างานปกติ').length;
                        return { name: d.name_th, total: emps.length, present, rate: emps.length ? (present/emps.length)*100 : 0 };
                      }).filter(d => d.total > 0).sort((a,b) => b.rate - a.rate);
                      
                      startPresentation('dept-stats', 'อันดับความตื่นตัวรายแผนก', { deptStats, date: new Date().toISOString().split('T')[0] })
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
                  >
                    นำเสนอสถิตินี้
                  </button>
                </div>
                
                {/* Option 4: Slideshow */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-indigo-50 dark:to-indigo-900/10 pointer-events-none"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--apple-text-primary)]">โหมดสไลด์โชว์ (Slideshow)</h3>
                      <p className="text-xs text-[var(--apple-text-secondary)] mt-0.5">หมุนสลับโชว์ข้อมูล 3 กราฟด้านบน อัตโนมัติทุกๆ 15 วินาที</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const latesAndMissing = tableEmployees.filter(emp => emp.isMissingPunch || emp.todayStatus.includes('ลา') || emp.todayStatus.includes('ลืม'));
                      const deptStats = departments.map(d => {
                        const emps = tableEmployees.filter(e => e.departments?.name_th === d.name_th);
                        const present = emps.filter(e => e.todayStatus === 'เข้างานปกติ').length;
                        return { name: d.name_th, total: emps.length, present, rate: emps.length ? (present/emps.length)*100 : 0 };
                      }).filter(d => d.total > 0).sort((a,b) => b.rate - a.rate);
                      
                      startPresentation('slideshow', 'สไลด์โชว์อัตโนมัติ', { chartData, dateRangeType, customStart, customEnd, employees: latesAndMissing, deptStats, date: new Date().toISOString().split('T')[0] })
                    }}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-sm transition relative z-10"
                  >
                    เริ่มโหมดสไลด์โชว์
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Preview & QR */}
            <div className="md:w-72 lg:w-96 flex flex-col gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-center">
                <h3 className="font-bold text-sm text-[var(--apple-text-secondary)] mb-4">สแกนเพื่อรับชม (Public Link)</h3>
                <div className="bg-white p-4 rounded-xl inline-block shadow-sm">
                  <img 
                    src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + ROUTES.LIVE : '')}&color=000000&bgcolor=ffffff\`}
                    alt="QR Code"
                    className="w-32 h-32"
                  />
                </div>
                <div className="mt-4 text-xs font-medium text-slate-500 bg-slate-200/50 dark:bg-slate-800 p-2 rounded-lg break-all">
                  {typeof window !== 'undefined' ? window.location.origin + ROUTES.LIVE : ''}
                </div>
                <a href={ROUTES.LIVE} target="_blank" rel="noreferrer" className="mt-3 block w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-[var(--apple-text-primary)] rounded-lg text-sm font-bold transition">
                  เปิดหน้าต่างจำลอง (Preview)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
`;

f = f.replace(
  "{activeTab === 'detailed' && <DetailedTimeReport />}",
  "{activeTab === 'detailed' && <DetailedTimeReport />}\n" + liveControlContent
);

fs.writeFileSync('app/(admin)/dashboard/page.tsx', f);
