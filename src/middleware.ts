import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'Unknown';

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
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
