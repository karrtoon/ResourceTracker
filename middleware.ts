import { withAuth } from "next-auth/middleware"
import { hasResourceAccess, hasUserManagementAccess } from './lib/discord-roles'
 
// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/resources',
  '/api/resources',
  '/api/user',
  '/api/users',
]

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can go here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        const debugEnabled = process.env.NEXTAUTH_DEBUG === 'true' || process.env.NODE_ENV === 'development'

        // Allow public routes
        if (!protectedRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // Check if user is authenticated first
        if (!token) {
          if (debugEnabled) console.debug('[middleware] no token for', pathname)
          return false
        }

        // Check if user has required roles
        const userRoles = (token.userRoles as string[]) || []

        // Route-specific permission checks
        if (pathname.startsWith('/users')) {
          if (debugEnabled) console.debug('[middleware] user management check; sub=', token.sub, 'rolesCount=', userRoles.length)
          return hasUserManagementAccess(userRoles)
        }

        if (debugEnabled) console.debug('[middleware] resource access check; sub=', token.sub, 'rolesCount=', userRoles.length)
        return hasResourceAccess(userRoles)
      },
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/resources/:path*', '/users/:path*']
} 