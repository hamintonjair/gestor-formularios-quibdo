import { useState } from 'react';
import { X, PlusCircle, CheckCircle2, FileQuestion } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface CreateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateForm: (title: string, description: string) => Promise<void>;
  isLoading: boolean;
}

export const CreateFormModal = ({
  isOpen,
  onClose,
  onCreateForm,
  isLoading,
}: CreateFormModalProps) => {
  const [title, setTitle] = useState('Registro de Ciudadanos e Inclusión Social');
  const [description, setDescription] = useState(
    'Formulario oficial para la recolección y actualización de datos de registro institucional.'
  );
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleStartCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmedCreate = async () => {
    setShowConfirm(false);
    await onCreateForm(title, description);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                <FileQuestion className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Crear Nuevo Formulario en Google Forms
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleStartCreate} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Título del Formulario
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Registro de Ciudadanos 2026"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Descripción Institucional
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Indique las instrucciones u objetivo del registro..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                {isLoading ? 'Creando...' : 'Crear en mi Google Forms'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showConfirm}
        title="¿Crear formulario en su cuenta de Google?"
        description={`Se creará un nuevo archivo de formulario en su cuenta de Google Drive / Google Forms titulado "${title}" con las preguntas de Nombre, Correo electrónico y Fecha de registro.`}
        confirmLabel="Sí, crear formulario"
        cancelLabel="Revisar"
        isLoading={isLoading}
        details={[
          `Título: ${title}`,
          'Campo 1: Nombre Completo',
          'Campo 2: Correo Electrónico',
          'Campo 3: Fecha de Registro',
          'Almacenado de forma segura en su Google Workspace institucional',
        ]}
        onConfirm={handleConfirmedCreate}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};
