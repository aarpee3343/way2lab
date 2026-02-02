import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// --------------------------------------------------
// ENV
// --------------------------------------------------
const jwtSecret = process.env.JWT_SECRET;
const SECRET_KEY = jwtSecret
  ? new TextEncoder().encode(jwtSecret)
  : null;

// --------------------------------------------------
// CORPORATE URL PATHS (MATCHES NEW FOLDERS)
// --------------------------------------------------
const corporatePaths = [
  '/corp',
  '/employees',
  '/corp-support',
  '/corp-users',
];

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (!SECRET_KEY) {
    console.error('JWT_SECRET missing');
    return NextResponse.next();
  }

  // ==================================================
  // 1. ADMIN PANEL (/admin)
  // ==================================================
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const adminToken = req.cookies.get('admin_token')?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    try {
      await jwtVerify(adminToken, SECRET_KEY);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // ==================================================
  // 2. CORPORATE MODULE (NEW STRUCTURE)
  // ==================================================
  const isCorporateRoute = corporatePaths.some(path =>
    pathname.startsWith(path)
  );

  if (isCorporateRoute) {
    const corpToken = req.cookies.get('corp_token')?.value;

    if (!corpToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
      const { payload } = await jwtVerify(corpToken, SECRET_KEY);
      const role = payload.role as string;

      if (role !== 'CORP_ADMIN' && role !== 'CORP_SUB_ADMIN') {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

// --------------------------------------------------
// MATCHER (MUST MATCH URLS, NOT FOLDER GROUPS)
// --------------------------------------------------
export const config = {
  matcher: [
    '/admin/:path*',
    '/corp/:path*',
    '/employees/:path*',
    '/corp-support/:path*',
    '/corp-users/:path*',
  ],
};
