import React from 'react';
import { ShieldCheck, AlertCircle, X, Building2, LogIn } from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { BrandingConfig, ThemeConfig } from '../types/theme';

interface LoginViewProps {
  branding: BrandingConfig;
  currentTheme: ThemeConfig;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  onLogin: () => void;
  onRedirectLogin: () => void;
  isLoggingIn: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({
  branding,
  currentTheme,
  errorMessage,
  setErrorMessage,
  onLogin,
  onRedirectLogin,
  isLoggingIn,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo institucional" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="w-full h-full rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: currentTheme.primaryHex }}>
                  <Building2 className="w-5 h-5" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">{branding.institutionName}</h1>
              <p className="text-xs text-slate-500 font-medium">{branding.subHeader}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Integración Segura
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className={`p-8 text-white relative bg-gradient-to-r ${currentTheme.headerGradient}`}>
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/20 text-white mb-3 backdrop-blur-xs">
                Acceso Institucional
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Formularios y Registros Dinámicos</h2>
              <p className="mt-2 text-white/90 text-xs sm:text-sm leading-relaxed">
                Cree formularios adaptados a cada necesidad institucional de manera ágil y personalizada.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-900">Autorización requerida</p>
                  <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
                <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex flex-col items-center gap-3.5 pt-2">
              <GoogleSignInButton onClick={onLogin} loading={isLoggingIn} disabled={isLoggingIn} text="Acceder con Google Workspace" />
              <button
                type="button"
                onClick={onRedirectLogin}
                disabled={isLoggingIn}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                ¿Problemas con la ventana emergente? Acceder con Redirección
              </button>
              <p className="text-[11px] text-slate-500 text-center max-w-xs leading-relaxed">
                Inicia sesión con tu cuenta de Google Workspace para autorizar el acceso y sincronizar tus formularios de Google Forms y Google Drive.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        {branding.subHeader}
      </footer>
    </div>
  );
};
