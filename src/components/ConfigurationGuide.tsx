import {
  ShieldCheck,
  Key,
  Calendar,
  Mail,
  Palette,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Database,
  Users,
  Sparkles,
} from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';

export const ConfigurationGuide = () => {
  const { currentTheme, formTheme, branding } = useAppTheme();
  const themeHex = formTheme.themeColor || currentTheme.primaryHex;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden"
        style={{ backgroundColor: themeHex }}
      >
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Documentación Oficial para Administradores y Propietarios</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Guía de Configuración e Implementación del Producto
          </h2>
          <p className="text-white/90 text-xs sm:text-sm leading-relaxed max-w-3xl">
            Bienvenido. Este manual paso a paso está diseñado para guiarte en la configuración completa de tu plataforma, cuentas de Google Workspace, credenciales OAuth, calendario y base de datos para operar de forma totalmente autónoma.
          </p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="rounded-3xl border p-5 shadow-2xs bg-white/90 backdrop-blur-xs space-y-2"
          style={{ borderColor: `${themeHex}30` }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: themeHex }}
          >
            <Key className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">1. Credenciales OAuth 2.0</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Configura tu Client ID y permisos de Google Cloud para habilitar el acceso seguro a Forms, Calendar y Contacts.
          </p>
        </div>

        <div
          className="rounded-3xl border p-5 shadow-2xs bg-white/90 backdrop-blur-xs space-y-2"
          style={{ borderColor: `${themeHex}30` }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: themeHex }}
          >
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">2. Google Calendar y Meet</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Habilita la sincronización bidireccional de audiencias, reuniones multi-usuario y enlaces automáticos de Google Meet.
          </p>
        </div>

        <div
          className="rounded-3xl border p-5 shadow-2xs bg-white/90 backdrop-blur-xs space-y-2"
          style={{ borderColor: `${themeHex}30` }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: themeHex }}
          >
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">3. Firebase y Datos</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Asegura la persistencia de datos mediante Firestore y autenticación con niveles gratuitos y seguros.
          </p>
        </div>
      </div>

      {/* Detailed Steps Section */}
      <div
        className="rounded-3xl border p-6 sm:p-8 bg-white/90 backdrop-blur-xs space-y-8 shadow-2xs"
        style={{ borderColor: `${themeHex}30` }}
      >
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Pasos Detallados para la Puesta en Marcha</span>
          </h3>
          <p className="text-xs text-slate-500">
            Sigue cada sección para garantizar que el sistema funcione al 100% con tu propia cuenta institucional o comercial.
          </p>
        </div>

        {/* Step 1 */}
        <div className="flex gap-4">
          <div
            className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: themeHex }}
          >
            1
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-bold text-slate-900">Creación del Proyecto en Google Cloud Console</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Para permitir que tus usuarios inicien sesión con su cuenta de Google y sincronicen formularios y calendarios:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
              <li>Ingresa a <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-semibold inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="w-3 h-3" /></a> y crea un nuevo proyecto.</li>
              <li>En el menú de APIs y Servicios, habilita las siguientes APIs: <strong>Google Forms API</strong>, <strong>Google Sheets API</strong>, <strong>Google Calendar API</strong>, y <strong>Google People API (Contactos)</strong>.</li>
              <li>Configura la pantalla de consentimiento OAuth con el nombre de tu institución o empresa y añade los scopes necesarios para Forms, Calendar y Drive.</li>
            </ul>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div
            className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: themeHex }}
          >
            2
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-bold text-slate-900">Configuración de Credenciales OAuth 2.0 y Variables de Entorno</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Genera credenciales de tipo <em>Aplicación Web</em> y añade tu URL de dominio en los orígenes de JavaScript autorizados y las URIs de redirección.
            </p>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[11px] text-slate-700 space-y-1">
              <p className="text-slate-400 font-sans font-semibold">Ejemplo de configuración en tu archivo .env:</p>
              <p>VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com</p>
              <p>VITE_FIREBASE_API_KEY=tu-api-key-de-firebase</p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div
            className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: themeHex }}
          >
            3
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-bold text-slate-900">Personalización de Marca y Temas Institucionales</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cada cliente que adquiera el producto puede personalizar la identidad visual completa desde el panel de administración:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
              <li>Sube el logotipo oficial de tu entidad o empresa.</li>
              <li>Selecciona el color corporativo principal (afecta automáticamente botones, barras, calendarios y formularios).</li>
              <li>Personaliza el subtítulo y nombre institucional que se muestra en la barra de navegación y los reportes.</li>
            </ul>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4">
          <div
            className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: themeHex }}
          >
            4
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-bold text-slate-900">Gestión de Costos y Licenciamiento</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Recuerda a tus clientes que la integración con las APIs de Google y Firebase opera bajo los <strong>niveles gratuitos (Free Tiers) y cuotas estándar</strong> de Google Cloud, por lo que no genera cobros por transacciones rutinarias, garantizando máxima rentabilidad en la reventa del producto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
