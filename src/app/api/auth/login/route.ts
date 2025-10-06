import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] [AUTH-LOGIN] Starting authentication`);
  
  try {
    const { password } = await request.json();
    const appPassword = process.env.APP_PASSWORD;
    const appPasswordsJson = process.env.APP_PASSWORDS;
    
    console.log(`[${requestId}] [AUTH-LOGIN] Password provided: ${password ? 'Yes' : 'No'}`);
    console.log(`[${requestId}] [AUTH-LOGIN] Single password configured: ${appPassword ? 'Yes' : 'No'}`);
    console.log(`[${requestId}] [AUTH-LOGIN] Multiple passwords configured: ${appPasswordsJson ? 'Yes' : 'No'}`);
    
    // Parse multiple passwords if provided, otherwise use single password
    let validPasswords: string[] = [];
    if (appPasswordsJson) {
      try {
        validPasswords = JSON.parse(appPasswordsJson);
        if (!Array.isArray(validPasswords)) {
          validPasswords = [];
        }
      } catch (error) {
        console.error(`[${requestId}] [AUTH-LOGIN] Error parsing APP_PASSWORDS:`, error);
        validPasswords = [];
      }
    } else if (appPassword) {
      validPasswords = [appPassword];
    }
    
    if (validPasswords.length === 0) {
      console.error(`[${requestId}] [AUTH-LOGIN] No valid passwords configured`);
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      );
    }
    
    if (!password) {
      console.log(`[${requestId}] [AUTH-LOGIN] No password provided`);
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    if (!validPasswords.includes(password)) {
      console.log(`[${requestId}] [AUTH-LOGIN] Invalid password attempt`);
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
    
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] [AUTH-LOGIN] Authentication successful in ${duration}ms`);
    
    // Set authentication cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('app-auth', appPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] [AUTH-LOGIN] Error after ${duration}ms:`, error);
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
