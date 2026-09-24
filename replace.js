const fs = require('fs');
let f = fs.readFileSync('app/(admin)/dashboard/page.tsx', 'utf8');

f = f.replace(
  '<Cast className="w-6 h-6" />',
  '<img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(typeof window !== \'undefined\' ? window.location.origin + ROUTES.LIVE : \'http://localhost:3000/live\')}&color=000000&bgcolor=ffffff`} alt="QR Code" className="w-16 h-16 rounded shadow-sm bg-white" />'
);

f = f.replace(
  'ผู้เข้าร่วมสามารถสแกน QR Code หรือเข้าลิงก์ /live เพื่อดูหน้าจอนี้ได้',
  'สแกน QR Code หรือเข้าลิงก์ /live เพื่อดูหน้าจอนี้บนมือถือได้ทันที'
);

fs.writeFileSync('app/(admin)/dashboard/page.tsx', f);
