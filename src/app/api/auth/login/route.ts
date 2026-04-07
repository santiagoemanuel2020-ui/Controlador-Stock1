import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/services/db';
import { verifyPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';

/**
 * POST /api/auth/login
 *
 * Lógica unificada:
 * 1. Si el usuario existe → validar contraseña → crear sesión
 * 2. Si el usuario NO existe → retornar USER_NOT_FOUND para que el frontend
 *    muestre el campo de código de acceso
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
      // Usuario no existe → el frontend debe mostrar el campo de código
      return NextResponse.json(
        { error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' },
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
