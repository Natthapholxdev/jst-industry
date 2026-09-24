const fs = require('fs');
let f = fs.readFileSync('app/live/page.tsx', 'utf8');

const additionalImports = `
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
`;
f = f.replace("import { Cast, RefreshCw, XCircle } from 'lucide-react';", additionalImports + "\nimport { Cast, RefreshCw, XCircle, AlertTriangle, Monitor, Building2, UserX } from 'lucide-react';");


const newRenderers = `
  const renderLateBoard = () => {
    const data = presentationState.payload;
    if (!data || !data.employees) return null;
    const { employees, date } = data;
    
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[700px]">
        <div className="p-8 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-rose-100 dark:bg-rose-800 text-rose-600 dark:text-rose-300 rounded-2xl">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-rose-700 dark:text-rose-400">กระดานแจ้งเตือนพนักงาน (Attention Board)</h2>
              <p className="text-rose-600/80 dark:text-rose-300/80 font-bold mt-1 text-lg">ประจำวันที่ {date} — โปรดติดต่อ HR ด่วน</p>
            </div>
          </div>
          <div className="text-5xl font-black text-rose-600 dark:text-rose-400">
            {employees.length} <span className="text-xl font-bold">รายการ</span>
          </div>
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
          {employees.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <UserX className="w-24 h-24 mb-6 opacity-50" />
              <h3 className="text-2xl font-bold">ยอดเยี่ยม! ไม่มีรายการแจ้งเตือนในวันนี้</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((emp: any, idx: number) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-l-8 border-rose-500 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition duration-300">
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1 truncate">{emp.full_name}</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">{emp.emp_code} • {emp.departments?.name_th || 'ไม่ระบุแผนก'}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <span className="inline-block px-4 py-2 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-lg font-bold rounded-xl w-full text-center">
                      {emp.todayStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDeptStats = () => {
    const data = presentationState.payload;
    if (!data || !data.deptStats) return null;
    const { deptStats, date } = data;
    
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[700px]">
        <div className="p-8 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300 rounded-2xl">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-emerald-700 dark:text-emerald-400">สถิติความตื่นตัวรายแผนก (Leaderboard)</h2>
              <p className="text-emerald-600/80 dark:text-emerald-300/80 font-bold mt-1 text-lg">เทียบสัดส่วนการเข้างานปกติ ประจำวันที่ {date}</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-8 bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-center">
          <ResponsiveContainer width="100%" height="90%">
            <RechartsBarChart data={deptStats} layout="vertical" margin={{ top: 20, right: 60, left: 100, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => val + '%'} stroke="#94a3b8" fontSize={14} fontWeight="bold" />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={16} fontWeight="bold" width={150} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                formatter={(value: number, name: string, props: any) => [\`\${value.toFixed(1)}% (\${props.payload.present}/\${props.payload.total} คน)\`, 'สัดส่วนเข้างาน']}
              />
              <Bar dataKey="rate" radius={[0, 8, 8, 0]} animationDuration={1500}>
                {deptStats.map((entry: any, index: number) => (
                  <Cell key={\`cell-\${index}\`} fill={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : index === 2 ? '#f59e0b' : '#94a3b8'} />
                ))}
                <LabelList dataKey="rate" position="right" formatter={(val: number) => val.toFixed(1) + '%'} style={{ fontSize: '18px', fontWeight: '900', fill: '#475569' }} />
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const [slideIndex, setSlideIndex] = useState(0);
  
  useEffect(() => {
    if (presentationState?.view_mode === 'slideshow') {
      const timer = setInterval(() => {
        setSlideIndex(prev => (prev + 1) % 3);
      }, 15000); // 15 seconds per slide
      return () => clearInterval(timer);
    }
  }, [presentationState]);

  const renderSlideshow = () => {
    if (slideIndex === 0) {
      return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700">
          {renderDeptStats()}
        </div>
      );
    } else if (slideIndex === 1) {
      return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700">
          {renderLateBoard()}
        </div>
      );
    } else {
      const data = presentationState.payload;
      return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700 bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 h-[700px] flex flex-col">
          <ExecutiveChart 
            title={presentationState.title}
            data={data.chartData} 
            xKey="date" 
            series={[
              { key: 'present', name: 'มาทำงานปกติ', color: '#10b981' },
              { key: 'leave', name: 'ลา / มีปัญหา', color: '#eab308' },
              { key: 'missingPunch', name: 'ลืมสแกนออก', color: '#f97316' },
              { key: 'absent', name: 'หยุด / ขาดงาน', color: '#94a3b8' }
            ]}
          />
        </div>
      );
    }
  };
`;

f = f.replace(
  "{presentationState.view_mode === 'detailed' && presentationState.payload && renderDetailedReport()}",
  "{presentationState.view_mode === 'detailed' && presentationState.payload && renderDetailedReport()}\n" +
  "          {presentationState.view_mode === 'late-board' && presentationState.payload && renderLateBoard()}\n" +
  "          {presentationState.view_mode === 'dept-stats' && presentationState.payload && renderDeptStats()}\n" +
  "          {presentationState.view_mode === 'slideshow' && presentationState.payload && renderSlideshow()}"
);

f = f.replace(
  "const renderDetailedReport = () => {",
  newRenderers + "\n\n  const renderDetailedReport = () => {"
);

fs.writeFileSync('app/live/page.tsx', f);
