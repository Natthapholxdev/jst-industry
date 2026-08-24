'use client';
import { useRouter } from 'next/navigation';

export default function MonthYearFilter({ empCode, currentMonth, currentYear }: { empCode: string, currentMonth: string, currentYear: string }) {
  const router = useRouter();

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>, type: 'month' | 'year') => {
    const value = e.target.value;
    const params = new URLSearchParams(window.location.search);
    
    if (type === 'month') {
      params.set('month', value);
    } else {
      params.set('year', value);
    }
    
    router.push(`/my-profile?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 items-center">
      <select 
        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
        value={currentMonth}
        onChange={(e) => handleFilterChange(e, 'month')}
      >
        {Array.from({ length: 12 }, (_, i) => {
          const monthStr = (i + 1).toString().padStart(2, '0');
          return <option key={monthStr} value={monthStr}>เดือน {monthStr}</option>;
        })}
      </select>
      
      <select 
        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
        value={currentYear}
        onChange={(e) => handleFilterChange(e, 'year')}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const year = (new Date().getFullYear() - 2 + i).toString();
          return <option key={year} value={year}>{year}</option>;
        })}
      </select>
    </div>
  );
}
