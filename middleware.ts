import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function middleware(req: NextRequest) {
  // Only run on /admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    
    // Allow access to login page
    if (req.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    const token = req.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    try {
      // Verify Token
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch (err) {
      // Invalid token
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};