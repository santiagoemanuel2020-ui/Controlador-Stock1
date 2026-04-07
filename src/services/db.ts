import { getSupabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
import type { User, AccessCode, Product, Movement, Company } from '@/types';

// ──────────────────────────────────────────────
// COMPANIES
// ──────────────────────────────────────────────

export async function createCompany(name: string): Promise<Company> {
  const { data, error } = await getSupabaseAdmin()
    .from('companies')
    .insert({ name })
    .select()
    .single();

  if (error) throw new Error(`Error creando empresa: ${error.message}`);
  return data as Company;
}

// ──────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────

export async function findUserByEmail(email: string, companyId: string): Promise<User | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('*')
    .eq('company_id', companyId)
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function createUser(
  companyId: string,
  email: string,
  password: string,
  role: 'owner' | 'employee' = 'employee'
): Promise<User> {
  const password_hash = await hashPassword(password);

  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .insert({
      company_id: companyId,
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

export async function getUserCountByCompany(companyId: string): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  if (error) throw new Error(`Error obteniendo conteo de usuarios: ${error.message}`);
  return count || 0;
}

export async function validateAccessCode(companyId: string, code: string): Promise<AccessCode | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('access_codes')
    .select('*')
    .eq('company_id', companyId)
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

// ──────────────────────────────────────────────
// PRODUCTS
// ──────────────────────────────────────────────

export async function getAllProducts(companyId: string): Promise<Product[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('products')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error obteniendo todos los productos: ${error.message}`);
  return (data || []) as Product[];
}

export async function getProducts(companyId: string, userId: string): Promise<Product[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('products')
    .select('*')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error obteniendo productos: ${error.message}`);
  return (data || []) as Product[];
}

export async function getProductById(companyId: string, id: string, userId: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('products')
    .select('*')
    .eq('company_id', companyId)
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as Product;
}

export async function createProduct(
  companyId: string,
  userId: string,
  product: Omit<Product, 'id' | 'company_id' | 'user_id' | 'created_at'>
): Promise<Product> {
  const { data, error } = await getSupabaseAdmin()
    .from('products')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ ...product, company_id: companyId, user_id: userId } as any)
    .select()
    .single();

  if (error) throw new Error(`Error creando producto: ${error.message}`);
  return data as Product;
}

export async function updateProduct(
  companyId: string,
  id: string,
  userId: string,
  updates: Partial<Omit<Product, 'id' | 'company_id' | 'user_id' | 'created_at'>>
): Promise<Product> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getSupabaseAdmin() as any)
    .from('products')
    .update(updates)
    .eq('company_id', companyId)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Error actualizando producto: ${error.message}`);
  return data as Product;
}

export async function deleteProduct(companyId: string, id: string, userId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('products')
    .delete()
    .eq('company_id', companyId)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`Error eliminando producto: ${error.message}`);
}

// ──────────────────────────────────────────────
// MOVEMENTS
// ──────────────────────────────────────────────

export async function getMovements(companyId: string, userId: string, limit = 50): Promise<Movement[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('movements')
    .select(`
      *,
      products(name)
    `)
    .eq('company_id', companyId)
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
  companyId: string,
  productId: string,
  userId: string
): Promise<Movement[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('movements')
    .select('*')
    .eq('company_id', companyId)
    .eq('product_id', productId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error obteniendo movimientos del producto: ${error.message}`);
  return (data || []) as Movement[];
}

export async function createMovement(
  companyId: string,
  userId: string,
  movement: Omit<Movement, 'id' | 'company_id' | 'created_at'>
): Promise<Movement> {
  const { data, error } = await getSupabaseAdmin()
    .from('movements')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ ...movement, company_id: companyId, user_id: userId } as any)
    .select()
    .single();

  if (error) throw new Error(`Error creando movimiento: ${error.message}`);
  return data as Movement;
}

/**
 * Crea un movimiento y actualiza el stock del producto en una transacción lógica.
 */
export async function recordStockMovement(
  companyId: string,
  userId: string,
  productId: string,
  quantity: number,
  type: 'in' | 'out'
): Promise<{ movement: Movement; newStock: number }> {
  // Obtener producto actual
  const product = await getProductById(companyId, productId, userId);
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
  await updateProduct(companyId, productId, userId, { stock: newStock });

  // Registrar movimiento
  const movement = await createMovement(companyId, userId, {
    product_id: productId,
    quantity,
    type,
  });

  return { movement, newStock };
}

// ──────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────

export async function getDashboardStats(companyId: string, userId: string, role: 'owner' | 'employee') {
  const products = await getAllProducts(companyId);
  const movements = await getMovements(companyId, userId, 10);

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock < 5);
  
  // Solo el owner ve el valor total del stock
  const totalStockValue = role === 'owner' 
    ? products.reduce((acc, p) => acc + p.price * p.stock, 0)
    : 0;

  return {
    totalProducts,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    totalStockValue,
    recentMovements: movements,
  };
}
