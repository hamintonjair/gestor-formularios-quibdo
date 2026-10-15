import { Users, Mail, Calendar, CheckCircle2 } from 'lucide-react';
import { RegistrationRecord } from '../types/forms';
import { formatDate } from '../services/formsApi';

interface StatsCardsProps {
  records: RegistrationRecord[];
  formTitle?: string;
}

export const StatsCards = ({ records }: StatsCardsProps) => {
  const total = records.length;

  // Unique emails
  const validEmails = records.filter(
    (r) => r.correo && r.correo.includes('@') && r.correo !== 'No especificado'
  );
  const uniqueEmails = new Set(validEmails.map((r) => r.correo.toLowerCase())).size;

  // Last registration date
  let lastRegistrationDate = 'Sin registros';
  if (records.length > 0) {
    // Sort by submittedAt / fechaRegistro descending
    const sorted = [...records].sort((a, b) => {
      const timeA = new Date(a.fechaRegistro || a.submittedAt).getTime() || 0;
      const timeB = new Date(b.fechaRegistro || b.submittedAt).getTime() || 0;
      return timeB - timeA;
    });
    lastRegistrationDate = formatDate(sorted[0].fechaRegistro || sorted[0].submittedAt);
  }

  // Count registered today
  const todayStr = new Date().toISOString().slice(0, 10);
  const registeredToday = records.filter((r) => {
    const dStr = r.fechaRegistro || r.submittedAt;
    return dStr && dStr.includes(todayStr);
  }).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Registros */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Registrados
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {total}
            </span>
            <span className="text-xs font-medium text-slate-500">
              personas
            </span>
          </div>
          <p className="text-[11px] text-teal-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Campo Nombre auditado
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Correos Electrónicos */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Correos Electrónicos
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {uniqueEmails}
            </span>
            <span className="text-xs font-medium text-slate-500">
              únicos
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {total > 0 ? `${Math.round((validEmails.length / total) * 100)}% cobertura` : '0%'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Mail className="w-6 h-6" />
        </div>
      </div>

      {/* Último Registro */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Último Registro
          </p>
          <div className="mt-1">
            <span className="text-sm font-bold text-slate-900 block truncate">
              {lastRegistrationDate}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {registeredToday > 0 ? `${registeredToday} recibidos hoy` : 'Sincronizado con Forms'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Calendar className="w-6 h-6" />
        </div>
      </div>

      {/* Estado del Formulario */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Campos del Registro
          </p>
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-xs font-bold text-slate-800">
              ✓ Nombre
            </span>
            <span className="text-xs font-bold text-slate-800">
              ✓ Correo Electrónico
            </span>
            <span className="text-xs font-bold text-slate-800">
              ✓ Fecha de Registro
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xs">
          100%
        </div>
      </div>
    </div>
  );
};
