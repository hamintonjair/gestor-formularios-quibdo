import React from 'react';
import { LayoutDashboard } from 'lucide-react';

interface PublicLandingProps {
  onGoToLogin: () => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({ onGoToLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex items-center justify-center p-6 text-center">
      <div className="max-w-2xl bg-white p-10 rounded-3xl shadow-xl border border-slate-200">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <LayoutDashboard className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold mb-4 text-slate-900">Gestor</h1>
        <p className="text-lg text-slate-600 mb-8">
          Plataforma integral para la gestión de registros, agendamiento de actividades y seguimiento de datos.
        </p>
        <button
          onClick={onGoToLogin}
          className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition"
        >
          Acceder a la Plataforma
        </button>
        <div className="mt-6">
          <a href="/privacy-policy.html" className="text-sm text-indigo-600 hover:underline font-medium">Ver Política de Privacidad</a>
        </div>
        <p className="mt-8 text-sm text-slate-400">
          Gestor - Plataforma de Gestión
        </p>
      </div>
    </div>
  );
};
