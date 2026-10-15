import React, { useState } from 'react';
import { X, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { DynamicFormField, DynamicQuestionType } from '../types/forms';
import { ConfirmationModal } from './ConfirmationModal';
import { useAppTheme } from '../context/ThemeContext';

interface AddFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  onAddField: (field: DynamicFormField) => Promise<void>;
  isLoading: boolean;
}

export const AddFieldModal: React.FC<AddFieldModalProps> = ({
  isOpen,
  onClose,
  formTitle,
  onAddField,
  isLoading,
}) => {
  const { currentTheme } = useAppTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DynamicQuestionType>('TEXT');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(['Opción 1', 'Opción 2']);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    setOptions([...options, `Opción ${options.length + 1}`]);
  };

  const handleUpdateOption = (idx: number, val: string) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  const handleRemoveOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setShowConfirm(true);
  };

  const handleConfirmed = async () => {
    setShowConfirm(false);
    const newField: DynamicFormField = {
      id: `field-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      required,
      options:
        type === 'RADIO' || type === 'CHECKBOX' || type === 'DROP_DOWN'
          ? options
          : undefined,
    };
    await onAddField(newField);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: currentTheme.primaryHex }}
              >
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Agregar Campo a "{formTitle}"
                </h2>
                <p className="text-xs text-slate-500">
                  Se añadirá directamente a tu Google Form conectado.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleStartSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Título de la Pregunta / Campo
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Barrio o Comuna, Celular, Tipo de Ayuda..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tipo de Respuesta
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as DynamicQuestionType)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="TEXT">Texto Corto</option>
                  <option value="PARAGRAPH">Párrafo Largo</option>
                  <option value="DATE">Fecha</option>
                  <option value="RADIO">Opción Única</option>
                  <option value="CHECKBOX">Casillas de Verificación</option>
                  <option value="DROP_DOWN">Lista Desplegable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Condición
                </label>
                <label className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Respuesta obligatoria</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Instrucciones o Aclaración (Opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Texto explicativo para la persona que responde..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900"
              />
            </div>

            {/* Options if choice */}
            {(type === 'RADIO' || type === 'CHECKBOX' || type === 'DROP_DOWN') && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-700 block uppercase text-[10px]">
                  Opciones de Respuesta:
                </span>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleUpdateOption(i, e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs text-teal-600 font-bold hover:underline"
                >
                  + Agregar otra opción
                </button>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer"
                style={{ backgroundColor: currentTheme.primaryHex }}
              >
                <Plus className="w-4 h-4" />
                <span>{isLoading ? 'Guardando...' : 'Añadir a Google Forms'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        title="¿Agregar campo al formulario de Google Forms?"
        description={`Se actualizará la estructura del formulario "${formTitle}" agregando la pregunta "${title}".`}
        confirmLabel="Confirmar y Agregar"
        cancelLabel="Revisar"
        isLoading={isLoading}
        details={[
          `Formulario destino: ${formTitle}`,
          `Pregunta: ${title}`,
          `Tipo: ${type}`,
          `Obligatorio: ${required ? 'Sí' : 'No'}`,
        ]}
        onConfirm={handleConfirmed}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};
