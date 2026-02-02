import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  
  // Clear the cookie by setting it to expire immediately
  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    expires: new Date(0), 
    path: '/',
  });
  
  return response;
}