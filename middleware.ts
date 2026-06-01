import { type NextRequest, NextResponse } from 'next/server'

// TEMP: auth desactivado — re-activar cuando se resuelva el login
export function middleware(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
