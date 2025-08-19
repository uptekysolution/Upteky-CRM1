import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const pathname = url.pathname

  const token = request.cookies.get('AuthToken')?.value
  const role = request.cookies.get('UserRole')?.value
  const publicPaths = ['/', '/login', '/portal/login', '/portal/register']
  if (publicPaths.includes(pathname)) return NextResponse.next()
  if (!token || !role) return NextResponse.redirect(new URL('/login', request.url))
  const lower = String(role || '').toLowerCase()
  const isAdmin = lower === 'admin'
  const isEmployee = lower === 'employee'
  const isClient = lower === 'client'

  if (pathname.startsWith('/admin')) {
    if (!isAdmin) return NextResponse.redirect(new URL('/login', request.url))
  } else if (pathname.startsWith('/employee')) {
    if (!isEmployee) return NextResponse.redirect(new URL('/login', request.url))
  } else if (pathname.startsWith('/client')) {
    if (!isClient) return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|public|favicon.ico).*)'],
}


