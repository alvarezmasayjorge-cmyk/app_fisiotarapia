import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith('/login')
  const isAdminPage = pathname.startsWith('/admin')
  const isPatientPage = pathname.startsWith('/patient')

  // If on login page and already authenticated, redirect to home
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // If not authenticated, redirect to login
  if (!isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based access control
  if (isAdminPage && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/patient', request.url))
  }

  if (isPatientPage && token?.role !== 'PATIENT') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/patient/:path*', '/login'],
}
