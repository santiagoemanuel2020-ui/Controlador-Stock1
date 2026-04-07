import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/services/db';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';

/**
 * POST /api/auth/login
 *
 * Requiere email, password y companyName para identificar la empresa
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, companyName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar la company por nombre
    let companyId: string | null = null;
    if (companyName) {
      const { data: company } = await getSupabaseAdmin()
        .from('companies')
        .select('id')
        .eq('name', companyName)
        .single();

      if (!company) {
        return NextResponse.json(
          { error: 'Empresa no encontrada' },
          { status: 404 }
        );
      }
      companyId = company.id;
    } else {
      // Si no se proporciona companyName, buscar si el email existe en alguna company
      // Esto es un caso edge, principalmente para backwards compatibility
      const { data: companies } = await getSupabaseAdmin()
        .from('users')
        .select('company_id')
        .eq('email', email.toLowerCase())
        .limit(1);

      if ((companies?.length ?? 0) === 0) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      companyId = (companies as any)[0].company_id;
    }

    // Buscar usuario
    if (!companyId) {
      return NextResponse.json(
        { error: 'No fue posible identificar la empresa' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email, companyId);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado en esta empresa' },
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
    await createSession(user.id, companyId, user.email, user.role);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
