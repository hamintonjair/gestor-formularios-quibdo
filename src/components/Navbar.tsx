import type { User } from 'firebase/auth';
import {
  LogOut,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building2,
  Palette,
  LogIn,
} from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  formUrl?: string;
  formTitle?: string;
  onOpenThemeConfig?: () => void;
  onConnectGoogle?: () => void;
  isTokenMissing?: boolean;
  currentView: 'forms' | 'meetings' | 'guide' | 'reminders';
  onSwitchView: (view: 'forms' | 'meetings' | 'guide' | 'reminders') => void;
}

export const Navbar = ({
  user,
  onLogout,
  onRefresh,
  isLoading,
  formUrl,
  formTitle,
  onOpenThemeConfig,
  onConnectGoogle,
  isTokenMissing,
  currentView,
  onSwitchView,
}: NavbarProps) => {
  const { branding, currentTheme, formTheme } = useAppTheme();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Organization Title with Custom Logo Support */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              {branding.logoUrl || formTheme.headerImageUrl ? (
                <img
                  src={branding.logoUrl || formTheme.headerImageUrl || ''}
                  alt="Logo institucional"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div
                  className="w-full h-full rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: formTheme.themeColor || currentTheme.primaryHex }}
                >
                  <Building2 className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                  {branding.institutionName}
                </h1>
                <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <ShieldCheck className="w-3 h-3" /> Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">
                {branding.subHeader}
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* View Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg mr-2">
              <button
                onClick={() => onSwitchView('forms')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${currentView === 'forms' ? 'bg-white shadow-xs text-indigo-900' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Formularios
              </button>
              <button
                onClick={() => onSwitchView('meetings')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${currentView === 'meetings' ? 'bg-white shadow-xs text-indigo-900' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Reuniones
              </button>
              <button
                onClick={() => onSwitchView('guide')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${currentView === 'guide' ? 'bg-white shadow-xs text-indigo-900' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Guía Config
              </button>
              <button
                onClick={() => onSwitchView('reminders')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${currentView === 'reminders' ? 'bg-white shadow-xs text-indigo-900' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Recordatorios
              </button>
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Sync Responses Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Sincronizar respuestas más recientes de Google Forms"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                style={{ color: isLoading ? currentTheme.primaryHex : undefined }}
              />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {/* Connect Google Workspace Button if not signed in or token missing */}
            {onConnectGoogle && (!user || isTokenMissing) && (
              <button
                type="button"
                onClick={onConnectGoogle}
                title={isTokenMissing ? "Re-autorizar para sincronizar" : "Conectar con tu cuenta de Google Workspace"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg shadow-2xs transition-opacity hover:opacity-95 cursor-pointer"
                style={{ backgroundColor: currentTheme.primaryHex }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isTokenMissing ? 'Re-autorizar' : 'Conectar Google'}</span>
              </button>
            )}

            {/* User Profile / Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuario'}
                      className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="hidden xl:block text-left text-xs">
                    <p className="font-semibold text-slate-800 leading-none truncate max-w-[140px]">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-slate-500 text-[11px] truncate max-w-[140px]">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
