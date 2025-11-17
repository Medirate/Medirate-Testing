import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Gate account creation behind form completion
  if (pathname.startsWith('/api/auth/register')) {
    const formComplete = request.cookies.get('mr_form_complete')?.value === '1'
    if (!formComplete) {
      const url = request.nextUrl.clone()
      url.pathname = '/subscribe'
      url.searchParams.set('must_complete_form', '1')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/auth/register']
}


