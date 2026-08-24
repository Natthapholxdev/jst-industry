import { jwtVerify, SignJWT } from 'jose';  
import { cookies } from 'next/headers';  
import { NextRequest } from 'next/server';  
// Secret key for signing the JWT (in a real app, use environment variables)  
const JWT_SECRET = new TextEncoder().encode(  
  process.env.JWT_SECRET || 'fallback_secret_key_for_jst_industry_hr_system'  
);  
  
// create Token  
export async function createSession(payload: any) {  
  const token = await new SignJWT(payload)  
    .setProtectedHeader({ alg: 'HS256' })  
    .setIssuedAt()  
    .setExpirationTime('1d') // expire in 1 day  
    .sign(JWT_SECRET);  
  
  const cookieStore = await cookies();  
  cookieStore.set('hr_session', token, {  
    httpOnly: true,  
    secure: process.env.NODE_ENV === 'production',  
    sameSite: 'lax',  
    maxAge: 60 * 60 * 24 // 1 day  
  });  
}  
  
// check Token  
export async function verifyAuth(token: string | undefined) {  
  if (!token) return null;  
  try {  
    const { payload } = await jwtVerify(token, JWT_SECRET);  
    return payload;  
  } catch (error) {  
    return null;  
  }  
}  
  
// get user from Request  
export async function getUserFromRequest(request: NextRequest | Request) {  
  // for NextRequest  
  if ('cookies' in request) {  
    const nextReq = request as NextRequest;  
    const token = nextReq.cookies.get('hr_session')?.value;  
    return verifyAuth(token);  
  }  
  
  // for Request  
  const authHeader = request.headers.get('cookie');  
  if (!authHeader) return null;  
  
  const tokenMatch = authHeader.match(/hr_session=([^;]+)/);  
  if (!tokenMatch) return null;  
  
  return verifyAuth(tokenMatch[1]);  
} 
