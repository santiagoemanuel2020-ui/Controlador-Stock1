import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/**
 * GET /api/auth/check
 * Verifica si hay una sesión activa.
 */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
    },
  });
}
