import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface ThaiDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

export default function ThaiDatePicker({ value, onChange, className = '', required = false }: ThaiDatePickerProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      // value should be YYYY-MM-DD
      const parts = value.split('-');
      if (parts.length === 3) {
        setDisplayValue(`${parts[2]}/${parts[1]}/${parseInt(parts[0]) + 543}`);
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, ''); // strip non-digits
    
    // Auto format as DD/MM/YYYY
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
    
    setDisplayValue(val);

    if (val.length === 10) {
      const parts = val.split('/');
      if (parts.length === 3) {
        const d = parts[0];
        const m = parts[1];
        const y = parts[2];
        const ceYear = parseInt(y) - 543;
        onChange(`${ceYear}-${m}-${d}`);
      }
    } else if (val === '') {
      onChange('');
    }
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.value) {
        onChange(e.target.value); // This is YYYY-MM-DD
     } else {
        onChange('');
     }
  };

  // Add pr-10 to className to make room for the calendar icon
  const combinedClassName = `${className} pr-10`;

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder="วว/ดด/ปปปป (พ.ศ.)"
        className={combinedClassName}
        maxLength={10}
        required={required && !value}
      />
      <input 
        type="date"
        value={value || ''}
        onChange={handleNativeDateChange}
        className="absolute right-0 opacity-0 cursor-pointer w-10 h-full z-10"
        title="เลือกจากปฏิทิน"
      />
      <Calendar className="w-5 h-5 absolute right-3 text-slate-400 pointer-events-none z-0" />
    </div>
  );
}
