'use server';

import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function adminLoginAction(username: string, pass: string) {
  try {
    // 1. Static Check (Replace with DB check in production)
    if (username !== 'admin' || pass !== 'admin123') {
        return { success: false, error: 'Invalid credentials' };
    }

    // 2. Create JWT
    const token = await new SignJWT({ role: 'admin', username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(SECRET_KEY);

    // 3. Set Cookie
    const cookieStore = await cookies(); // ✅ Must await this
    
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // ✅ Only require HTTPS in prod
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, error: 'Login failed' };
  }
}