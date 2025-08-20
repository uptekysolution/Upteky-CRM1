import { NextRequest, NextResponse } from 'next/server'

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|public|favicon.ico).*)'],
}


