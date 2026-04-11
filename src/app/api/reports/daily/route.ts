import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getDailyMovements } from '@/services/db';

// GET /api/reports/daily
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;

    const report = await getDailyMovements(session.userId, date);
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    );
  }
}