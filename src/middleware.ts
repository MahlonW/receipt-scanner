import { NextRequest, NextResponse } from 'next/server';

// Array of paths that should be excluded from authentication
const EXCLUDED_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/check',
  '/api/auth/logout',
  '/api/health',
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/logo.svg',
  '/manifest.json',
];

// Check if a path should be excluded from authentication
const isExcludedPath = (pathname: string): boolean => {
  return EXCLUDED_PATHS.some(path => 
    pathname === path || pathname.startsWith(path)
  );
};

export function middleware(request: NextRequest) {
  const start = Date.now();
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'Unknown';

  // Check for password protection
  const appPassword = process.env.APP_PASSWORD;
  const appPasswordsJson = process.env.APP_PASSWORDS; // JSON array of passwords
  
  // Parse multiple passwords if provided, otherwise use single password
  let validPasswords: string[] = [];
  if (appPasswordsJson) {
    try {
      validPasswords = JSON.parse(appPasswordsJson);
      if (!Array.isArray(validPasswords)) {
        validPasswords = [];
      }
    } catch (error) {
      console.error('Error parsing APP_PASSWORDS:', error);
      validPasswords = [];
    }
  } else if (appPassword) {
    validPasswords = [appPassword];
  }
  
  if (validPasswords.length > 0 && !isExcludedPath(pathname)) {
    const sessionPassword = request.cookies.get('app-auth')?.value;
    
    if (!sessionPassword || !validPasswords.includes(sessionPassword)) {
      // Redirect to login page
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Log the incoming request
  console.log(`[${new Date().toISOString()}] ${method} ${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''} - ${ip} - ${userAgent}`);

  // Continue with the request
  const response = NextResponse.next();

  // Add response time header
  const duration = Date.now() - start;
  response.headers.set('X-Response-Time', `${duration}ms`);

  // Log the response
  console.log(`[${new Date().toISOString()}] ${method} ${pathname} - ${response.status} - ${duration}ms`);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     * Exclusions are handled in the middleware logic for better maintainability
     */
    '/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|css|js|ico|svg)$).*)',
  ],
};
