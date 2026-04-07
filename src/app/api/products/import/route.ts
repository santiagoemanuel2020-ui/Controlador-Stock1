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
 * Importa productos con lógica "upsert":
 * - Si el producto ya existe (por nombre) → actualiza price, stock, category
 * - Si no existe → crea nuevo
 * - Registra movimientos de entrada para productos nuevos o con incremento de stock
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const products: ImportProduct[] = body.products;
    const mode = body.mode || 'upsert'; // 'upsert' (actualiza) o 'replace' (borra todo)

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron productos para importar' },
        { status: 400 }
      );
    }

    // Validar cada producto
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

    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Si mode es 'replace', primero borramos todos los productos del usuario
    if (mode === 'replace') {
      await db
        .from('products')
        .delete()
        .eq('company_id', session.companyId)
        .eq('user_id', session.userId);
    }

    // Obtener productos existentes del usuario (para comparar stock)
    const { data: existingProducts } = await db
      .from('products')
      .select('id, name, stock')
      .eq('company_id', session.companyId)
      .eq('user_id', session.userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingByName = new Map<string, { id: string; name: string; stock: number }>(
      (existingProducts || []).map((p: { id: string; name: string; stock: number }) => [p.name.toLowerCase(), p])
    );

    // Procesar cada producto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productsToInsert: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productsToUpdate: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movements: any[] = [];

    for (const p of validProducts) {
      const existing = existingByName.get(p.name.toLowerCase());

      if (existing) {
        // El producto ya existe - actualizar
        const stockDiff = p.stock - existing.stock;
        
        productsToUpdate.push({
          id: existing.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          category: p.category,
        });

        // Si hay incremento de stock, registrar movimiento de entrada
        if (stockDiff > 0) {
          movements.push({
            company_id: session.companyId,
            product_id: existing.id,
            user_id: session.userId,
            quantity: stockDiff,
            type: 'in',
          });
        }
      } else {
        // Producto nuevo - insertar
        productsToInsert.push({
          name: p.name,
          price: p.price,
          stock: p.stock,
          category: p.category,
          company_id: session.companyId,
          user_id: session.userId,
        });

        // Registrar movimiento de entrada para stock inicial
        if (p.stock > 0) {
          // We'll add the product_id after insertion
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let newProducts: any[] = [];

    // Insertar productos nuevos
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

      // Agregar movimientos para productos nuevos con stock inicial
      for (const p of newProducts) {
        if (p.stock > 0) {
          movements.push({
            company_id: session.companyId,
            product_id: p.id,
            user_id: session.userId,
            quantity: p.stock,
            type: 'in',
          });
        }
      }
    }

    // Actualizar productos existentes
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

    // Registrar todos los movimientos
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
