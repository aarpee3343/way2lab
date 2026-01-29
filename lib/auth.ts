import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export async function getAuthUser(req?: Request): Promise<AuthUser | null> {
  try {
    // 1. Try getting token from Authorization Header
    const headersList = await headers();
    let token = headersList.get('authorization')?.split(' ')[1];

    // 2. If not in header, try query param (useful for PDF downloads)
    if (!token && req) {
      const { searchParams } = new URL(req.url);
      token = searchParams.get('token');
    }

    if (!token) return null;

    // 3. Verify Token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}