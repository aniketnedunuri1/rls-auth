import { createServerSupabaseClient } from '@/lib/supabase-server-client'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const publicPaths = ['/', '/login', '/register']

// API paths that don't require authentication
const publicApiPaths = ['/api/stripe/webhook']

export async function middleware(request: NextRequest) {
  // Check if the path is a public API path
  const isPublicApiPath = publicApiPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  // Skip authentication for public API paths
  if (isPublicApiPath) {
    return NextResponse.next()
  }

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path
  )

  // Create Supabase client
  const supabase = await createServerSupabaseClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  // Handle API routes - return 401 for unauthenticated users
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // If the path is public and user is logged in, redirect to dashboard
  if (isPublicPath && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If the path is private and user is not logged in, redirect to login
  if (!isPublicPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}