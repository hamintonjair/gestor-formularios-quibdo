import { useState } from 'react';
import {
  FolderKanban,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Link2,
  CheckCircle,
  Plus,
  UserPlus,
  FileSpreadsheet,
  Palette,
  Trash2,
} from 'lucide-react';
import { GoogleDriveFile, GoogleFormSchema } from '../types/forms';
import { useAppTheme } from '../context/ThemeContext';

interface FormSelectorProps {
  currentForm: GoogleFormSchema | null;
  driveForms: GoogleDriveFile[];
  linkedSpreadsheet: GoogleDriveFile | null;
  isLoadingDrive: boolean;
  onSelectFormId: (formId: string) => void;
  onOpenDynamicCreateModal: () => void;
  onOpenAddFieldModal: () => void;
  onOpenDynamicRecordModal: () => void;
  onManualIdSubmit: (idOrUrl: string) => void;
  onOpenThemeConfig?: () => void;
  onDeleteForm?: (file: GoogleDriveFile) => void;
}

export const FormSelector = ({
  currentForm,
  driveForms,
  linkedSpreadsheet,
  isLoadingDrive,
  onSelectFormId,
  onOpenDynamicCreateModal,
  onOpenAddFieldModal,
  onOpenDynamicRecordModal,
  onManualIdSubmit,
  onOpenThemeConfig,
  onDeleteForm,
}: FormSelectorProps) => {
  const { formTheme, currentTheme } = useAppTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onManualIdSubmit(manualInput.trim());
    setManualInput('');
    setShowManualInput(false);
  };

  // Google Sheets spreadsheet URL
  const spreadsheetUrl = linkedSpreadsheet?.webViewLink
    ? linkedSpreadsheet.webViewLink
    : currentForm
    ? `https://docs.google.com/forms/d/${currentForm.formId}/edit#responses`
    : null;

  const themeHex = formTheme.themeColor || currentTheme.primaryHex;

  return (
    <div
      className="rounded-3xl border shadow-2xs p-4 sm:p-5 transition-all backdrop-blur-xs"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        borderColor: `${themeHex}30`,
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Active Form info */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {formTheme.headerImageUrl ? (
            <a
              href={`https://docs.google.com/forms/d/${currentForm?.formId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-16 h-12 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden cursor-pointer"
              title="Banner de encabezado configurado - Haz clic para modificar en Google Forms"
            >
              <img
                src={formTheme.headerImageUrl}
                alt="Banner de encabezado"
                className="max-h-full max-w-full object-contain"
              />
            </a>
          ) : (
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
              style={{
                backgroundColor: `${themeHex}15`,
                color: themeHex,
              }}
            >
              <FolderKanban className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: `${themeHex}10`,
                  color: themeHex,
                  borderColor: `${themeHex}30`,
                }}
              >
                Formulario Seleccionado
              </span>
              {currentForm && (
                <span className="text-xs text-slate-400 font-mono">
                  ID: {currentForm.formId.slice(0, 10)}...
                </span>
              )}
            </div>

            {currentForm ? (
              <div className="mt-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2
                    className="text-base sm:text-lg font-bold text-slate-900 truncate"
                    style={{ fontFamily: formTheme.headerFont || 'inherit' }}
                  >
                    {currentForm.info.title || 'Formulario sin título'}
                  </h2>




                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {currentForm.info.description ||
                    'Formulario dinámico activo para recolección de Nombre, Correo y Fecha de Registro.'}
                </p>
              </div>
            ) : (
              <div className="mt-1">
                <h2 className="text-sm sm:text-base font-semibold text-slate-800">
                  Selecciona o crea un formulario para administrar registros
                </h2>
                <p className="text-xs text-slate-500">
                  Explora formularios existentes de tu Google Drive o genera uno nuevo con campos a tu medida.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {/* Drive Forms Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer w-full sm:w-auto"
            >
              <span>{isLoadingDrive ? 'Cargando Drive...' : 'Explorar Formularios'}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 max-h-80 overflow-y-auto animate-in fade-in duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                    <span>Formularios en tu Google Drive</span>
                    <span>({driveForms.length})</span>
                  </div>

                  {isLoadingDrive ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Buscando formularios...
                    </div>
                  ) : driveForms.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs text-slate-500 font-medium">
                        No se encontraron formularios en Google Drive
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenDynamicCreateModal();
                        }}
                        className="mt-2 text-xs font-semibold hover:underline"
                        style={{ color: themeHex }}
                      >
                        + Crear uno nuevo a la medida
                      </button>
                    </div>
                  ) : (
                    driveForms.map((file) => {
                      const isSelected = currentForm?.formId === file.id;
                      return (
                        <div
                          key={file.id}
                          className={`w-full px-3.5 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 border-b border-slate-50 last:border-0 ${
                            isSelected ? 'bg-slate-100/90' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectFormId(file.id);
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-start gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                          >
                            <div className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                              {isSelected ? (
                                <CheckCircle
                                  className="w-3.5 h-3.5"
                                  style={{ color: themeHex }}
                                />
                              ) : (
                                <FolderKanban className="w-3 h-3" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-slate-800 text-xs truncate ${isSelected ? 'font-bold' : 'font-medium'}`}>
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                ID: {file.id}
                              </p>
                            </div>
                          </button>

                          {onDeleteForm && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsDropdownOpen(false);
                                onDeleteForm(file);
                              }}
                              title={`Eliminar "${file.name}" de Google Drive`}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}

                  <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setShowManualInput(true);
                      }}
                      className="text-left px-2 py-1.5 text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5 text-slate-400" />
                      Ingresar enlace o ID de formulario
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Add Field to active form button */ }
          {currentForm && (
            <button
              type="button"
              onClick={onOpenAddFieldModal}
              title="Añadir una nueva pregunta a este formulario en Google Forms"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Campo</span>
            </button>
          )}

          {/* Theme Configuration Button */}
          {onOpenThemeConfig && (
            <button
              type="button"
              onClick={onOpenThemeConfig}
              title="Configuración del tema visual, colores y tipografías"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              <Palette className="w-3.5 h-3.5 text-amber-600" />
              <span>Configurar Tema</span>
            </button>
          )}

          {/* Delete active form button */}
          {currentForm && onDeleteForm && (
            <button
              type="button"
              onClick={() => {
                const activeFile = driveForms.find((f) => f.id === currentForm.formId) || {
                  id: currentForm.formId,
                  name: currentForm.info.title || 'Formulario Activo',
                };
                onDeleteForm(activeFile);
              }}
              title={`Eliminar "${currentForm.info.title || 'este formulario'}" de Google Drive`}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          )}



          {/* Create New Form according to needs */}
          <button
            type="button"
            onClick={onOpenDynamicCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
            style={{ backgroundColor: themeHex }}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Formulario Dinámico</span>
          </button>
        </div>
      </div>

      {/* Manual Input Inline Modal / Panel */}
      {showManualInput && (
        <form
          onSubmit={handleManualSubmit}
          className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5 animate-in fade-in"
        >
          <div className="relative flex-1 w-full">
            <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Pega el enlace o ID del formulario (ej. https://docs.google.com/forms/d/...)"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              Cargar
            </button>
            <button
              type="button"
              onClick={() => setShowManualInput(false)}
              className="px-3 py-2 text-xs sm:text-sm text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Form summary footer */}
      {currentForm?.items && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end text-[11px] text-slate-500">
          <span className="text-slate-500 font-medium">
            {currentForm.items.length} campos en el formulario
          </span>
        </div>
      )}
    </div>
  );
};
