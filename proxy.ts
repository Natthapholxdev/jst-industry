import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';

const SQLI_PATTERNS = [
  /(\b(UNION\s+SELECT|DROP\s+TABLE|ALTER\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM)\b)/i,
  /('|")\s*(OR|AND)\s*('|")?\w+\s*=\s*('|")?\w+/i, 
  /--\s*$/i 
];
const rateLimitMap = new Map<string, { count: number, startTime: number }>();

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown_ip';

  // --- 🛡️ WAF (Web Application Firewall) สำหรับ API ---
  if (pathname.startsWith('/api/')) {
    const userAgent = request.headers.get('user-agent') || '';
    
    // 1. ตรวจจับ Postman / cURL / Burp
    if (userAgent.includes('PostmanRuntime') || userAgent.includes('curl/') || userAgent.includes('Burp')) {
      console.warn(`🛑 [BLOCKED] ตรวจพบการใช้เครื่องมือยิง API ตรงๆ จาก IP: ${ip}`);
      return NextResponse.json({ error: 'API Direct Access Forbidden' }, { status: 403 });
    }

    // 2. Rate Limiting (100 req / min)
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 100;
    const rateData = rateLimitMap.get(ip) || { count: 0, startTime: now };
    
    if (now - rateData.startTime > windowMs) {
      rateData.count = 1;
      rateData.startTime = now;
    } else {
      rateData.count++;
    }
    rateLimitMap.set(ip, rateData);

    if (rateData.count > maxRequests) {
      console.warn(`🔥 [RATE LIMIT] IP: ${ip} โดนระงับชั่วคราว`);
      return NextResponse.json({ error: 'Too Many Requests (Rate Limited)' }, { status: 429 });
    }

    // 3. ตรวจสอบ SQL Injection (Query String)
    const decodedSearch = decodeURIComponent(search);
    for (const pattern of SQLI_PATTERNS) {
      if (pattern.test(decodedSearch)) {
        console.warn(`🚨 [SECURITY] SQL Injection Query | IP: ${ip} | URL: ${pathname}${search}`);
        return NextResponse.json({ error: 'Blocked by WAF' }, { status: 403 });
      }
    }

    // 4. ตรวจสอบ SQL Injection (Body) - ข้ามการตรวจถ้าเป็นไฟล์อัปโหลด
    const contentType = request.headers.get('content-type') || '';
    if ((request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') && !contentType.includes('multipart/form-data')) {
      try {
        const clonedReq = request.clone();
        const textBody = await clonedReq.text();
        for (const pattern of SQLI_PATTERNS) {
          if (pattern.test(textBody)) {
            console.warn(`🚨 [SECURITY] SQL Injection Body | IP: ${ip} | Payload: ${textBody}`);
            return NextResponse.json({ error: 'Blocked by WAF' }, { status: 403 });
          }
        }
      } catch (e) {}
    }
  }
  // --- สิ้นสุด WAF ---

  const sessionCookie = request.cookies.get('hr_session');

  // Paths that are considered public or auth-related
  const isAuthPage = pathname.startsWith('/login') || pathname === '/';
  const isPublic = pathname.startsWith('/live') || pathname === '/api/presentation';

  if (!sessionCookie) {
    // If not logged in and trying to access a protected route
    if (!isAuthPage && !pathname.startsWith('/api') && !isPublic) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // If accessing root, redirect to login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    const session: any = await verifyAuth(sessionCookie.value);
    
    if (!session) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('hr_session');
      return response;
    }

    // If logged in and trying to access login page or root, redirect to dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid cookie format
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('hr_session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
