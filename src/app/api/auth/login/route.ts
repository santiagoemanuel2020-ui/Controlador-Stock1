import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/services/db';
import { verifyPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';

/**
 * POST /api/auth/login
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Validar contraseña
    const validPassword = await verifyPassword(password, user.password_hash);

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Crear sesión
    await createSession(user.id, user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}