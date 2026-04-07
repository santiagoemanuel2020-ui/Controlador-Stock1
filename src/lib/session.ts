import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { Session } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const COOKIE_NAME = 'stock_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

/**
 * Crea un JWT y lo guarda en una cookie segura httpOnly.
 */
export async function createSession(userId: string, email: string): Promise<void> {
  const token = jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

/**
 * Lee la cookie y valida el JWT. Retorna la sesión o null.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Session;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Destruye la sesión eliminando la cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/**
 * Middleware helper: verifica si hay sesión activa.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}