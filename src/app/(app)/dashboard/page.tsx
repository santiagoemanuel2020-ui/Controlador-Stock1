import { getDashboardStats } from '@/services/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const stats = await getDashboardStats(session.userId);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Resumen de tu inventario</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Total Products */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total productos</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Stock bajo</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStockCount}</p>
            </div>
          </div>
        </div>

        {/* Stock Value */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Valor del stock</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats.totalStockValue.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="font-semibold text-red-800">Productos con stock bajo</h3>
          </div>
          <div className="space-y-2">
            {stats.lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5">
                <span className="text-sm font-medium text-slate-800">{product.name}</span>
                <span className="text-sm font-bold text-red-600">{product.stock} uds</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Movements */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Últimos movimientos</h2>
          <Link href="/movements" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todos →
          </Link>
        </div>
        {stats.recentMovements.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.recentMovements.map((movement) => (
              <div key={movement.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    movement.type === 'in' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className={`text-sm font-bold ${
                      movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.type === 'in' ? '+' : '-'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {movement.product_name || 'Producto eliminado'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(movement.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}