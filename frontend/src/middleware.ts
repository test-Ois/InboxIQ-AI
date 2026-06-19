import { auth } from '@/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isProtectedRoute =
    nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/inbox') ||
    nextUrl.pathname.startsWith('/settings');

  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL('/login', nextUrl));
  }
});

export const config = {
  // Catch all except static assets and standard API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
