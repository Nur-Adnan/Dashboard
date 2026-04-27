import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === '/login';
  const isApiAuthRoute = pathname.startsWith('/api/auth/');
  const isCronRoute = pathname.startsWith('/api/cron/');
  const isApiRoute = pathname.startsWith('/api/');

  if (!isApiRoute) {
    if (isAuthRoute) {
      return NextResponse.next();
    }
  } else {
    if (isApiAuthRoute || isCronRoute) {
      return NextResponse.next();
    }
  }

  const token = request.cookies.get('access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = verifyAccessToken(token);
    
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.id);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-name', payload.name);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    if (isApiRoute) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!login|api/auth|cron|_next/static|_next/image|favicon.ico).*)',
  ],
};