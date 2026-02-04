import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const RAW_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
const SECRET_KEY = RAW_SECRET ? new TextEncoder().encode(RAW_SECRET) : null;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (!SECRET_KEY) {
    console.error('JWT_SECRET missing');
    return NextResponse.next();
  }

  // ================= ADMIN =================
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname === '/admin/register') {
      return NextResponse.next();
    }

    const adminToken = req.cookies.get('admin_token')?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    try {
      const { payload } = await jwtVerify(adminToken, SECRET_KEY);
      if (!payload?.adminId) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // ================= CORPORATE =================
  if (
    pathname.startsWith('/corp') ||
    pathname.startsWith('/employees') ||
    pathname.startsWith('/corp-support') ||
    pathname.startsWith('/corp-users') ||
    pathname.startsWith('/corp-settings') ||
    pathname.startsWith('/corp-reports')
  ) {
    // Allow corp login page
    if (pathname === '/corp-login') {
      return NextResponse.next();
    }

    const corpToken = req.cookies.get('corp_token')?.value;
    if (!corpToken) {
      return NextResponse.redirect(new URL('/corp-login', req.url));
    }

    try {
      const { payload } = await jwtVerify(corpToken, SECRET_KEY);
      const role = payload.role as string;

      if (!['SUPER_ADMIN', 'DEPT_HEAD', 'LOCATION_MANAGER'].includes(role)) {
        return NextResponse.redirect(new URL('/corp-login', req.url));
      }

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/corp-login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/corp/:path*',
    '/employees/:path*',
    '/corp-support/:path*',
    '/corp-users/:path*',
    '/corp-settings/:path*',
    '/corp-reports/:path*',
  ],
};
