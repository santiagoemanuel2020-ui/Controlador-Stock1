import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProducts, getMovements } from '@/services/db';

/**
 * GET /api/backup
 * Devuelve todos los datos del usuario (productos + movimientos) para respaldo.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const [products, movements] = await Promise.all([
      getProducts(session.userId),
      getMovements(session.userId, 1000),
    ]);

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      user: {
        email: session.email,
        userId: session.userId,
      },
      products,
      movements,
      summary: {
        totalProducts: products.length,
        totalMovements: movements.length,
        totalStock: products.reduce((acc, p) => acc + p.stock, 0),
        totalValue: products.reduce((acc, p) => acc + p.price * p.stock, 0),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    );
  }
}