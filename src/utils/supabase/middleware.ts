import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. Bypass Supabase Auth completely for Telegram Webhook
  if (request.nextUrl.pathname.startsWith('/api/jarvis/telegram')) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /admin and /api (except public webhooks or auth)
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/admin') || 
                           (request.nextUrl.pathname.startsWith('/api') && 
                            !request.nextUrl.pathname.startsWith('/api/auth') && 
                            !request.nextUrl.pathname.startsWith('/api/jarvis/telegram')
                           )

  if (isProtectedRoute && !user) {
      // Redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/jarvis/telegram (Telegram Webhook)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/jarvis/telegram|_next/static|_next/image|favicon.ico).*)',
  ],
}
