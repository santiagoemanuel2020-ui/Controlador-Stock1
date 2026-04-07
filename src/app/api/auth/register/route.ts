import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser, validateAccessCode, incrementCodeUsage, getUserCount } from '@/services/db';
import { createSession } from '@/lib/session';

/**
 * POST /api/auth/register
 *
 * Registra un nuevo usuario validando el código de acceso.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, accessCode } = await request.json();

    // Validaciones
    if (!email || !password || !accessCode) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar que el usuario no exista ya
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      );
    }

    // Validar código de acceso
    const validCode = await validateAccessCode(accessCode);
    if (!validCode) {
      return NextResponse.json(
        { error: 'Código inválido o agotado' },
        { status: 403 }
      );
    }

    // Determinar rol: primer usuario es owner, los demás employee
    const userCount = await getUserCount();
    const role = userCount === 0 ? 'owner' : 'employee';

    // Crear usuario
    const user = await createUser(email, password, role);

    // Incrementar uso del código
    await incrementCodeUsage(validCode.id);

    // Crear sesión automáticamente
    await createSession(user.id, user.email, user.role);

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
