import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(_req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/video/:path*',
    '/subscription',
    // Add other protected routes here
  ],
};
