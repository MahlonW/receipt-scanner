import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] [AUTH-LOGOUT] Starting logout`);
  
  try {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] [AUTH-LOGOUT] Logout successful in ${duration}ms`);
    
    // Clear authentication cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('app-auth', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] [AUTH-LOGOUT] Error after ${duration}ms:`, error);
    
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
