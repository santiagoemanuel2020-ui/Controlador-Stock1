import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase';

interface ImportProduct {
  name: string;
  price: number;
  stock: number;
  category: string;
}

/**
 * POST /api/products/import
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const products: ImportProduct[] = body.products;
    const mode = body.mode || 'upsert';

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron productos para importar' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    const validProducts: ImportProduct[] = [];

    products.forEach((p, i) => {
      const name = p.name?.trim();
      if (!name) {
        errors.push(`Fila ${i + 1}: Nombre vacío`);
        return;
      }
      const price = parseFloat(String(p.price)) || 0;
      const stock = parseInt(String(p.stock)) || 0;
      const category = p.category?.trim() || '';

      validProducts.push({ name, price, stock, category });
    });

    if (validProducts.length === 0) {
      return NextResponse.json(
        { error: 'Ningún producto válido para importar', details: errors },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getSupabaseAdmin() as any;

    // Si mode es 'replace', primero borramos todos los productos del usuario
    if (mode === 'replace') {
      await db
        .from('products')
        .delete()
        .eq('user_id', session.userId);
    }

    // Obtener productos existentes del usuario
    const { data: existingProducts } = await db
      .from('products')
      .select('id, name, stock')
      .eq('user_id', session.userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingByName = new Map<string, { id: string; name: string; stock: number }>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (existingProducts || []).map((p: any) => [p.name.toLowerCase(), p])
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productsToInsert: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productsToUpdate: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movements: any[] = [];

    for (const p of validProducts) {
      const existing = existingByName.get(p.name.toLowerCase());

      if (existing) {
        const stockDiff = p.stock - existing.stock;
        
        productsToUpdate.push({
          id: existing.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          category: p.category,
        });

        if (stockDiff > 0) {
          movements.push({
            product_id: existing.id,
            user_id: session.userId,
            quantity: stockDiff,
            type: 'in',
          });
        }
      } else {
        productsToInsert.push({
          name: p.name,
          price: p.price,
          stock: p.stock,
          category: p.category,
          user_id: session.userId,
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let newProducts: any[] = [];

    if (productsToInsert.length > 0) {
      const { data: inserted, error: insertError } = await db
        .from('products')
        .insert(productsToInsert)
        .select();

      if (insertError) {
        return NextResponse.json(
          { error: `Error al importar: ${insertError.message}` },
          { status: 500 }
        );
      }

      newProducts = inserted || [];

      for (const p of newProducts) {
        if (p.stock > 0) {
          movements.push({
            product_id: p.id,
            user_id: session.userId,
            quantity: p.stock,
            type: 'in',
          });
        }
      }
    }

    for (const p of productsToUpdate) {
      await db
        .from('products')
        .update({
          name: p.name,
          price: p.price,
          stock: p.stock,
          category: p.category,
        })
        .eq('id', p.id);
    }

    if (movements.length > 0) {
      await db
        .from('movements')
        .insert(movements);
    }

    return NextResponse.json({
      success: true,
      created: newProducts.length,
      updated: productsToUpdate.length,
      total: productsToInsert.length + productsToUpdate.length,
      errors,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    );
  }
}