import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/services/db';
import { createSession } from '@/lib/session';

/**
 * POST /api/auth/register
 * Registro libre - cualquiera puede crear una cuenta
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      );
    }

    // Crear usuario
    const user = await createUser(email, password);

    // Crear sesión
    await createSession(user.id, user.email);

    return NextResponse.json(
      { success: true, message: 'Cuenta creada exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}