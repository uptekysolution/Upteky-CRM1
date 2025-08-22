import { NextRequest, NextResponse } from 'next/server'

// Add this function to check if a path should be protected
function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/employee/dashboard/attendance',
    '/admin/dashboard/attendance',
    '/dashboard/attendance'
  ]
  return protectedRoutes.some(route => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const pathname = url.pathname

  const token = request.cookies.get('AuthToken')?.value
  const role = request.cookies.get('UserRole')?.value
  const publicPaths = ['/', '/login', '/portal/login', '/portal/register']
  
  if (publicPaths.includes(pathname)) return NextResponse.next()
  if (!token || !role) return NextResponse.redirect(new URL('/login', request.url))
  
  // Normalize role for comparison (case-insensitive, trimmed)
  const normalizedRole = String(role || '').toLowerCase().trim()
  
  // Define role groups
  const adminRoles = ['admin', 'sub-admin']
  const employeeRoles = ['employee', 'hr', 'team lead', 'business development', 'bde']
  const clientRoles = ['client']
  
  const isAdmin = adminRoles.includes(normalizedRole)
  const isEmployee = employeeRoles.includes(normalizedRole)
  const isClient = clientRoles.includes(normalizedRole)

  // Debug logging
  console.log('Middleware - Role check:', {
    originalRole: role,
    normalizedRole,
    pathname,
    isAdmin,
    isEmployee,
    isClient
  })

  if (pathname.startsWith('/admin')) {
    if (!isAdmin) {
      console.log('Middleware - Admin access denied for role:', normalizedRole)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } else if (pathname.startsWith('/employee')) {
    if (!isEmployee) {
      console.log('Middleware - Employee access denied for role:', normalizedRole)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } else if (pathname.startsWith('/client')) {
    if (!isClient) {
      console.log('Middleware - Client access denied for role:', normalizedRole)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Check if this is a protected attendance route
  if (isProtectedRoute(pathname)) {
    // For now, we'll let the page handle permission checks
    // The page components will use the AttendancePermissionGuard
    // This middleware can be extended later to check permissions at the route level
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


