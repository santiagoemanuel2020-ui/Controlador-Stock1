import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser, lookupAccessCodeGlobal, incrementCodeUsage, createCompany } from '@/services/db';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createSession } from '@/lib/session';

/**
 * POST /api/auth/register
 *
 * Registra un nuevo usuario con multi-tenancy.
 * - Primer usuario: crea una nueva company y es owner (no necesita código de acceso)
 * - Empleados: usar código de acceso válido para la company del owner
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, accessCode, companyName } = await request.json();

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

    let companyId: string;
    let role: 'owner' | 'employee' = 'employee';

    // Flujo 1: Primer usuario (crea nueva company)
    if (!accessCode) {
      // Solo el primer usuario globalmente puede registrarse sin código
      const { count: totalUsers } = await getSupabaseAdmin()
        .from('users')
        .select('*', { count: 'exact', head: true });

      if ((totalUsers ?? 0) > 0) {
        return NextResponse.json(
          { error: 'Se requiere código de acceso para registrarse' },
          { status: 403 }
        );
      }

      // Crear nueva company
      if (!companyName) {
        return NextResponse.json(
          { error: 'El nombre de la empresa es requerido' },
          { status: 400 }
        );
      }

      const company = await createCompany(companyName);
      companyId = company.id;
      role = 'owner';
    } else {
      // Flujo 2: Empleado (usa código de acceso)
      const accessCodeData = await lookupAccessCodeGlobal(accessCode);
      if (!accessCodeData) {
        return NextResponse.json(
          { error: 'Código de acceso inválido o agotado' },
          { status: 403 }
        );
      }

      companyId = accessCodeData.company_id;

      // Verificar que el email no esté registrado en esta company
      const existingUser = await findUserByEmail(email, companyId);
      if (existingUser) {
        return NextResponse.json(
          { error: 'Este email ya está registrado en esta empresa' },
          { status: 409 }
        );
      }

      // Incrementar uso del código
      await incrementCodeUsage(accessCodeData.id);
    }

    // Crear usuario
    const user = await createUser(companyId, email, password, role);

    // Crear sesión
    await createSession(user.id, companyId, user.email, user.role);

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
