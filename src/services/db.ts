import { getSupabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
import type { User, AccessCode, Product, Movement } from '@/types';

// ──────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function createUser(
  email: string,
  password: string,
  role: 'owner' | 'employee' = 'employee'
): Promise<User> {
  const password_hash = await hashPassword(password);

  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash,
      role,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select()
    .single();

  if (error) throw new Error(`Error creando usuario: ${error.message}`);
  return data as User;
}

export async function getUserCount(): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (error) throw new Error(`Error obteniendo conteo de usuarios: ${error.message}`);
  return count || 0;
}

export async function validateAccessCode(code: string): Promise<AccessCode | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('access_codes')
    .select('*')
    .eq('code', code.trim())
    .single();

  if (error || !data) return null;

  const accessCode = data as AccessCode;

  // Verificar que no esté agotado
  if (accessCode.used_count >= accessCode.max_uses) {
    return null;
  }

  return accessCode;
}

export async function incrementCodeUsage(codeId: string): Promise<void> {
  // Usamos un update atómico con RPC de Supabase si existe,
  // sino hacemos un update directo con contador actual + 1
  const { data: current } = await getSupabaseAdmin()
    .from('access_codes')
    .select('used_count')
    .eq('id', codeId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentCount = (current as any)?.used_count ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (getSupabaseAdmin() as any)
    .from('access_codes')
    .update({ used_count: currentCount + 1 })
    .eq('id', codeId);

  if (error) {
    throw new Error(`Error incrementando uso del código: ${error.message}`);
  }
}

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error obteniendo todos los productos: ${error.message}`);
  return (data || []) as Product[];
}

export async function getProducts(userId: string): Promise<Product[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error obteniendo productos: ${error.message}`);
  return (data || []) as Product[];
}

export async function getProductById(id: string, userId: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as Product;
}

export async function createProduct(
  userId: string,
  product: Omit<Product, 'id' | 'user_id' | 'created_at'>
): Promise<Product> {
  const { data, error } = await getSupabaseAdmin()
    .from('products')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ ...product, user_id: userId } as any)
    .select()
    .single();

  if (error) throw new Error(`Error creando producto: ${error.message}`);
  return data as Product;
}

export async function updateProduct(
  id: string,
  userId: string,
  updates: Partial<Omit<Product, 'id' | 'user_id' | 'created_at'>>
): Promise<Product> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getSupabaseAdmin() as any)
    .from('products')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Error actualizando producto: ${error.message}`);
  return data as Product;
}

export async function deleteProduct(id: string, userId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`Error eliminando producto: ${error.message}`);
}

// ──────────────────────────────────────────────
// MOVEMENTS
// ──────────────────────────────────────────────

export async function getMovements(userId: string, limit = 50): Promise<Movement[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('movements')
    .select(`
      *,
      products(name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Error obteniendo movimientos: ${error.message}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((m: any) => ({
    ...m,
    product_name: m.products?.name || 'Producto eliminado',
  })) as Movement[];
}

export async function getProductMovements(
  productId: string,
  userId: string
): Promise<Movement[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('movements')
    .select('*')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error obteniendo movimientos del producto: ${error.message}`);
  return (data || []) as Movement[];
}

export async function createMovement(
  userId: string,
  movement: Omit<Movement, 'id' | 'created_at'>
): Promise<Movement> {
  const { data, error } = await getSupabaseAdmin()
    .from('movements')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ ...movement, user_id: userId } as any)
    .select()
    .single();

  if (error) throw new Error(`Error creando movimiento: ${error.message}`);
  return data as Movement;
}

/**
 * Crea un movimiento y actualiza el stock del producto en una transacción lógica.
 */
export async function recordStockMovement(
  userId: string,
  productId: string,
  quantity: number,
  type: 'in' | 'out'
): Promise<{ movement: Movement; newStock: number }> {
  // Obtener producto actual
  const product = await getProductById(productId, userId);
  if (!product) throw new Error('Producto no encontrado');

  // Validar stock suficiente para salidas
  if (type === 'out' && product.stock < quantity) {
    throw new Error('Stock insuficiente');
  }

  // Calcular nuevo stock
  const newStock = type === 'in'
    ? product.stock + quantity
    : product.stock - quantity;

  // Actualizar stock
  await updateProduct(productId, userId, { stock: newStock });

  // Registrar movimiento
  const movement = await createMovement(userId, {
    product_id: productId,
    user_id: userId,
    quantity,
    type,
  });

  return { movement, newStock };
}

// ──────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────

export async function getDashboardStats(userId: string, role: 'owner' | 'employee') {
  const products = role === 'owner' ? await getAllProducts() : await getProducts(userId);
  const movements = await getMovements(userId, 10);

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock < 5);
  const totalStockValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);

  return {
    totalProducts,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    totalStockValue,
    recentMovements: movements,
  };
}
