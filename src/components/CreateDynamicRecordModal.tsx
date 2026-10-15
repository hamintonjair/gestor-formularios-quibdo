import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, Calendar, Mail, User } from 'lucide-react';
import { RegistrationRecord, GoogleFormSchema } from '../types/forms';
import { useAppTheme } from '../context/ThemeContext';

interface CreateDynamicRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentForm: GoogleFormSchema | null;
  onAddLocalRecord: (record: RegistrationRecord) => void;
}

export const CreateDynamicRecordModal: React.FC<CreateDynamicRecordModalProps> = ({
  isOpen,
  onClose,
  currentForm,
  onAddLocalRecord,
}) => {
  const { currentTheme } = useAppTheme();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [extraAnswer, setExtraAnswer] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: RegistrationRecord = {
      id: `manual-reg-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      nombre: nombre.trim(),
      correo: correo.trim(),
      fechaRegistro: fecha || new Date().toISOString(),
      documento: documento.trim() || undefined,
      telefono: telefono.trim() || undefined,
      rawAnswers: {
        'ans-nombre': {
          questionTitle: 'Nombre Completo',
          answerText: nombre.trim(),
        },
        'ans-correo': {
          questionTitle: 'Correo Electrónico',
          answerText: correo.trim(),
        },
        'ans-fecha': {
          questionTitle: 'Fecha de Registro',
          answerText: fecha,
        },
        ...(documento.trim()
          ? {
              'ans-doc': {
                questionTitle: 'Número de Documento / Cédula',
                answerText: documento.trim(),
              },
            }
          : {}),
        ...(telefono.trim()
          ? {
              'ans-tel': {
                questionTitle: 'Teléfono o Celular',
                answerText: telefono.trim(),
              },
            }
          : {}),
        ...(extraAnswer.trim()
          ? {
              'ans-extra': {
                questionTitle: 'Observaciones / Dependencia',
                answerText: extraAnswer.trim(),
              },
            }
          : {}),
      },
      respondentEmail: correo.trim(),
    };

    onAddLocalRecord(newRecord);
    setNombre('');
    setCorreo('');
    setDocumento('');
    setTelefono('');
    setExtraAnswer('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: currentTheme.primaryHex }}
            >
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Crear Registro Según la Necesidad
              </h2>
              <p className="text-xs text-slate-500">
                Ingresa los datos para registrar a una persona de inmediato.
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Nombre Completo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. María Elena Córdoba Rentería"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900"
            />
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Correo Electrónico
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ej. maria.cordoba@ejemplo.com"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900"
            />
          </div>

          {/* Fecha de Registro */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Fecha de Registro
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900"
            />
          </div>

          {/* Documento y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Cédula / Documento
              </label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ej. 1077890123"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Teléfono o Celular
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. 312 456 7890"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Observaciones o Dependencia (Opcional)
            </label>
            <input
              type="text"
              value={extraAnswer}
              onChange={(e) => setExtraAnswer(e.target.value)}
              placeholder="Ej. Barrio Kennedy, Solicitud subsidio social"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer"
              style={{ backgroundColor: currentTheme.primaryHex }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Registro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
