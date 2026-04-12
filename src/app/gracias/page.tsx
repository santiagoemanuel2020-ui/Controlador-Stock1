'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GraciasPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Redirect to login after 10 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md text-center animate-fade-in">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-full mb-6 shadow-lg shadow-emerald-500/25">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">¡Gracias por tu compra! 🎉</h1>
        
        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <p className="text-slate-300 mb-6">
            Para acceder a la app, necesitás crear tu cuenta con el código de acceso que recibiste.
          </p>

          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-emerald-300 mb-2">Tu código de acceso:</p>
            <p className="text-2xl font-bold text-emerald-400 tracking-wider">NUEVO-CODIGO35</p>
          </div>

          <p className="text-slate-400 text-sm mb-4">
            📄 <strong>Importante:</strong> También podés descargar las instrucciones desde el PDF que te llegó por email.
          </p>

          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Crear mi cuenta
          </a>
        </div>

        {/* Auto redirect */}
        <p className="text-slate-500 text-sm">
          Redirigiendo al registro en {countdown} segundos...
        </p>
      </div>
    </div>
  );
}