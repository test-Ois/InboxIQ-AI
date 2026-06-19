import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SignJWT } from 'jose';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const SHARED_JWT_SECRET = process.env.SHARED_JWT_SECRET || '';

async function catchAll(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'You must be logged in to access this resource.' } },
      { status: 401 }
    );
  }

  if (!SHARED_JWT_SECRET) {
    console.error('❌ SHARED_JWT_SECRET is not configured on the Next.js server.');
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Server configuration error.' } },
      { status: 500 }
    );
  }

  // 1. Sign a short-lived backend JWT (valid for 5 minutes) containing session data
  const secretBytes = new TextEncoder().encode(SHARED_JWT_SECRET);
  const token = await new SignJWT({
    sub: session.user.id,
    email: session.user.email,
    name: session.user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secretBytes);

  // 2. Resolve destination URL
  const resolvedPath = path.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const destUrl = `${BACKEND_URL}/api/${resolvedPath}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Forward client details if available
    const forwardedIp = req.headers.get('x-forwarded-for') || (req as any).ip;
    if (forwardedIp) {
      headers['x-forwarded-for'] = forwardedIp;
    }
    const userAgent = req.headers.get('user-agent');
    if (userAgent) {
      headers['user-agent'] = userAgent;
    }

    const method = req.method;
    let body: string | undefined = undefined;
    
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const rawBody = await req.json();
        body = JSON.stringify(rawBody);
      } catch {
        // Safe fallback if body is empty or malformed JSON
        body = undefined;
      }
    }

    const response = await fetch(destUrl, {
      method,
      headers,
      body,
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`❌ Proxy routing failed for: ${destUrl}`, error);
    return NextResponse.json(
      { success: false, error: { code: 'GATEWAY_ERROR', message: 'Failed to communicate with downstream services.' } },
      { status: 502 }
    );
  }
}

export { catchAll as GET, catchAll as POST, catchAll as PUT, catchAll as DELETE };
