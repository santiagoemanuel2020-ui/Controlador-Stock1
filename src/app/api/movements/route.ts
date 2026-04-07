import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getMovements, recordStockMovement } from '@/services/db';

// GET /api/movements
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const movements = await getMovements(session.userId);
    return NextResponse.json(movements);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    );
  }
}

// POST /api/movements
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { productId, quantity, type } = body;

    if (!productId || !quantity || !type) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    const result = await recordStockMovement(
      session.userId,
      productId,
      parseInt(quantity),
      type
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    );
  }
}