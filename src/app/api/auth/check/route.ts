import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] [AUTH-CHECK] Checking authentication status`);
  
  try {
    const appPassword = process.env.APP_PASSWORD;
    const appPasswordsJson = process.env.APP_PASSWORDS;
    const sessionPassword = request.cookies.get('app-auth')?.value;
    
    console.log(`[${requestId}] [AUTH-CHECK] Single password configured: ${appPassword ? 'Yes' : 'No'}`);
    console.log(`[${requestId}] [AUTH-CHECK] Multiple passwords configured: ${appPasswordsJson ? 'Yes' : 'No'}`);
    console.log(`[${requestId}] [AUTH-CHECK] Session cookie present: ${sessionPassword ? 'Yes' : 'No'}`);
    
    // Parse multiple passwords if provided, otherwise use single password
    let validPasswords: string[] = [];
    if (appPasswordsJson) {
      try {
        validPasswords = JSON.parse(appPasswordsJson);
        if (!Array.isArray(validPasswords)) {
          validPasswords = [];
        }
      } catch (error) {
        console.error(`[${requestId}] [AUTH-CHECK] Error parsing APP_PASSWORDS:`, error);
        validPasswords = [];
      }
    } else if (appPassword) {
      validPasswords = [appPassword];
    }
    
    if (validPasswords.length === 0) {
      // No password protection configured
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] [AUTH-CHECK] No password protection configured in ${duration}ms`);
      return NextResponse.json({ authenticated: true });
    }
    
    if (!sessionPassword) {
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] [AUTH-CHECK] No session cookie in ${duration}ms`);
      return NextResponse.json({ authenticated: false });
    }
    
    const isAuthenticated = validPasswords.includes(sessionPassword);
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] [AUTH-CHECK] Authentication ${isAuthenticated ? 'valid' : 'invalid'} in ${duration}ms`);
    
    return NextResponse.json({ authenticated: isAuthenticated });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] [AUTH-CHECK] Error after ${duration}ms:`, error);
    
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}
