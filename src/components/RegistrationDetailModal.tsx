import { useState } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  Phone,
  CreditCard,
  Copy,
  Check,
  FileText,
  Clock,
} from 'lucide-react';
import { RegistrationRecord } from '../types/forms';
import { formatDate } from '../services/formsApi';

interface RegistrationDetailModalProps {
  record: RegistrationRecord | null;
  onClose: () => void;
}

export const RegistrationDetailModal = ({
  record,
  onClose,
}: RegistrationDetailModalProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!record) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Detalle del Registro Ciudadano
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                ID de Respuesta: {record.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Main 3 Requested Fields highlight card */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50/50 border border-teal-200/80 rounded-2xl p-4.5 space-y-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-white/80 px-2 py-0.5 rounded-md border border-teal-200/50">
              Campos Principales Obligatorios
            </span>

            {/* 1. Nombre */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    Nombre
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {record.nombre || 'No registrado'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(record.nombre, 'nombre')}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Copiar nombre"
              >
                {copiedField === 'nombre' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* 2. Correo Electrónico */}
            <div className="flex items-start justify-between gap-3 pt-2 border-t border-teal-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    Correo Electrónico
                  </span>
                  <a
                    href={`mailto:${record.correo}`}
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    {record.correo || 'No registrado'}
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(record.correo, 'correo')}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Copiar correo"
              >
                {copiedField === 'correo' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* 3. Fecha de Registro */}
            <div className="flex items-start justify-between gap-3 pt-2 border-t border-teal-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    Fecha de Registro
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatDate(record.fechaRegistro)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(record.fechaRegistro, 'fecha')}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Copiar fecha"
              >
                {copiedField === 'fecha' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Secondary metadata if available */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {record.documento && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    Cédula / Documento
                  </p>
                  <p className="text-xs font-semibold text-slate-800">
                    {record.documento}
                  </p>
                </div>
              </div>
            )}

            {record.telefono && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    Teléfono / Móvil
                  </p>
                  <a
                    href={`tel:${record.telefono}`}
                    className="text-xs font-semibold text-slate-800 hover:text-teal-600"
                  >
                    {record.telefono}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* All answers submitted to Google Forms */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Respuestas Registradas en el Formulario
            </h4>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
              {Object.keys(record.rawAnswers).length === 0 ? (
                <div className="p-3 text-slate-400 italic">
                  No se recibieron campos de respuesta adicionales.
                </div>
              ) : (
                Object.entries(record.rawAnswers).map(([key, item]) => (
                  <div key={key} className="p-3 bg-white hover:bg-slate-50">
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      {item.questionTitle}
                    </span>
                    <span className="text-slate-900 font-medium whitespace-pre-wrap">
                      {item.answerText || '—'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submission metadata */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Enviado a Google Forms:
            </span>
            <span className="font-medium text-slate-700">
              {formatDate(record.submittedAt)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
