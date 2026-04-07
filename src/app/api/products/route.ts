import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProducts, createProduct, getAllProducts } from '@/services/db';

// GET /api/products
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    // Todos ven todos los productos
    const products = await getAllProducts();
    return NextResponse.json(products);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    );
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, price, stock, category } = body;

    if (!name) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });

    const product = await createProduct(session.userId, {
      name,
      price: price || 0,
      stock: stock || 0,
      category: category || '',
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    );
  }
}
