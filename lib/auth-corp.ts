import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function getCorpUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('corp_token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as any;
  } catch (err) {
    return null;
  }
}