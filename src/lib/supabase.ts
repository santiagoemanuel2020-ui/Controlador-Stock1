import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client con service_role key (SOLO server-side).
 * Este cliente bypass RLS porque manejamos auth propia.
 * NUNCA exponer este cliente en el cliente (browser).
 *
 * Se crea de forma lazy para evitar errores en build time
 * cuando las variables de entorno no están definidas.
 */
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        'Faltan variables de entorno de Supabase. ' +
        'Configurá NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local'
      );
    }

    _supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _supabaseAdmin;
}
