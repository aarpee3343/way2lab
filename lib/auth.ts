import { headers, cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthUser {
  id: number;
  email?: string | null;
  name?: string | null;
  role: string;
  corporateId?: number | null;
}

export async function getAuthUser(req?: Request): Promise<AuthUser | null> {
  try {
    let token;

    // 1. PRIORITY: Try getting token from HttpOnly Cookie (Browser Standard)
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('token');
    
    if (cookieToken) {
      token = cookieToken.value;
    }

    // 2. FALLBACK: Try Authorization Header (For Postman, Mobile Apps, or external APIs)
    if (!token) {
      const headersList = await headers();
      const authHeader = headersList.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    // 3. FALLBACK: Query Param (Useful for PDF download links)
    if (!token && req) {
      const { searchParams } = new URL(req.url);
      token = searchParams.get('token') || undefined;
    }

    if (!token) return null;

    // 4. Verify Token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}
