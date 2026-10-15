import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ListPlus,
  Lock,
  Palette,
  Layers,
  Type,
  Image as ImageIcon,
  Sliders,
  Upload,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { DynamicFormField, DynamicQuestionType } from '../types/forms';
import {
  GoogleFormThemeProperties,
  FONT_OPTIONS,
  GOOGLE_FORMS_PALETTE,
} from '../types/theme';
import { ConfirmationModal } from './ConfirmationModal';
import { useAppTheme } from '../context/ThemeContext';

interface DynamicFormBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateForm: (
    title: string,
    description: string,
    fields: DynamicFormField[],
    themeProps: GoogleFormThemeProperties
  ) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_FIELDS: DynamicFormField[] = [];

export const DynamicFormBuilderModal: React.FC<DynamicFormBuilderModalProps> = ({
  isOpen,
  onClose,
  onCreateForm,
  isLoading,
}) => {
  const { formTheme: initialFormTheme, currentTheme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'fields' | 'theme'>('fields');
  const [title, setTitle] = useState('Registro de Ciudadanos e Inclusión Social');
  const [description, setDescription] = useState(
    'Formulario dinámico oficial para la captura y seguimiento de datos institucionales.'
  );
  const [fields, setFields] = useState<DynamicFormField[]>(DEFAULT_FIELDS);
  const [formTheme, setFormTheme] = useState<GoogleFormThemeProperties>(initialFormTheme);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleAddField = (
    presetTitle?: string,
    presetType: DynamicQuestionType = 'TEXT',
    presetOptions?: string[]
  ) => {
    const newField: DynamicFormField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: presetTitle || `Nuevo Campo ${fields.length + 1}`,
      type: presetType,
      required: false,
      options:
        presetOptions ||
        (presetType === 'RADIO' || presetType === 'CHECKBOX' || presetType === 'DROP_DOWN'
          ? ['Opción 1', 'Opción 2']
          : undefined),
      isSystemMandatory: false,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id || f.isSystemMandatory));
  };

  const handleUpdateField = (id: string, updates: Partial<DynamicFormField>) => {
    setFields(
      fields.map((f) => {
        if (f.id !== id) return f;
        return { ...f, ...updates };
      })
    );
  };

  const handleAddOption = (fieldId: string) => {
    setFields(
      fields.map((f) => {
        if (f.id !== fieldId) return f;
        const opts = f.options || [];
        return {
          ...f,
          options: [...opts, `Opción ${opts.length + 1}`],
        };
      })
    );
  };

  const handleUpdateOption = (fieldId: string, optIndex: number, val: string) => {
    setFields(
      fields.map((f) => {
        if (f.id !== fieldId) return f;
        const opts = [...(f.options || [])];
        opts[optIndex] = val;
        return { ...f, options: opts };
      })
    );
  };

  const handleRemoveOption = (fieldId: string, optIndex: number) => {
    setFields(
      fields.map((f) => {
        if (f.id !== fieldId) return f;
        const opts = (f.options || []).filter((_, i) => i !== optIndex);
        return { ...f, options: opts };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setShowConfirm(true);
  };

  const handleConfirmedCreate = async () => {
    setShowConfirm(false);
    await onCreateForm(title, description, fields, formTheme);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: formTheme.themeColor || currentTheme.primaryHex }}
              >
                <ListPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Crear Formulario Dinámico en Google Forms
                </h2>
                <p className="text-xs text-slate-500">
                  Configura campos y propiedades de tema (estilo texto, encabezado y color).
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

          {/* Navigation Tabs (Campos vs Propiedades de Tema) */}
          <div className="flex border-b border-slate-200 bg-white px-6">
            <button
              type="button"
              onClick={() => setActiveTab('fields')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'fields'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Campos del Formulario ({fields.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('theme')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'theme'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>2. Propiedades de Tema (Estilo, Color y Encabezado)</span>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* General Title & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Título del Formulario
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Registro de Ciudadanos e Inclusión Social"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Descripción o Instrucciones
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instrucciones para los ciudadanos o usuarios..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900 resize-none"
                />
              </div>
            </div>

            {/* TAB 1: CAMPOS DEL FORMULARIO */}
            {activeTab === 'fields' && (
              <div className="space-y-4">
                {/* Quick Presets Bar */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Plantillas rápidas de campos para agregar:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddField('Barrio o Comuna', 'TEXT')}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      + Barrio / Comuna
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddField('Tipo de Población', 'DROP_DOWN', [
                          'Población General',
                          'Víctima del Conflicto',
                          'Comunidad Afrodescendiente',
                          'Pueblo Indígena',
                          'Adulto Mayor',
                          'Persona con Discapacidad',
                        ])
                      }
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      + Tipo de Población
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddField('Programa Social de Interés', 'RADIO', [
                          'Subsidio y Asistencia',
                          'Capacitación y Empleo',
                          'Seguridad Alimentaria',
                          'Salud y Bienestar',
                        ])
                      }
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      + Programa Social
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddField('Observaciones y Comentarios', 'PARAGRAPH')
                      }
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      + Observaciones
                    </button>
                  </div>
                </div>

                {/* Configured Fields List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Campos que se crearán en Google Forms ({fields.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAddField()}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Otro Campo</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          field.isSystemMandatory
                            ? 'bg-teal-50/40 border-teal-200/80'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-5 h-5 rounded-md bg-slate-200/80 text-slate-600 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={field.title}
                              disabled={field.isSystemMandatory}
                              onChange={(e) =>
                                handleUpdateField(field.id, { title: e.target.value })
                              }
                              placeholder="Nombre de la pregunta"
                              className="font-bold text-xs sm:text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none flex-1 px-1 py-0.5"
                            />
                            {field.isSystemMandatory && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 shrink-0">
                                <Lock className="w-3 h-3" /> Campo Requerido
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {!field.isSystemMandatory && (
                              <select
                                value={field.type}
                                onChange={(e) =>
                                  handleUpdateField(field.id, {
                                    type: e.target.value as DynamicQuestionType,
                                  })
                                }
                                className="text-[11px] font-semibold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="TEXT">Texto Corto</option>
                                <option value="PARAGRAPH">Párrafo Largo</option>
                                <option value="DATE">Fecha</option>
                                <option value="RADIO">Opción Única</option>
                                <option value="CHECKBOX">Casillas de Verificación</option>
                                <option value="DROP_DOWN">Lista Desplegable</option>
                              </select>
                            )}

                            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                disabled={field.isSystemMandatory}
                                onChange={(e) =>
                                  handleUpdateField(field.id, {
                                    required: e.target.checked,
                                  })
                                }
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                              />
                              <span className="text-[11px] font-medium">Obligatorio</span>
                            </label>

                            {!field.isSystemMandatory && (
                              <button
                                type="button"
                                onClick={() => handleRemoveField(field.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Eliminar campo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {(field.type === 'RADIO' ||
                          field.type === 'CHECKBOX' ||
                          field.type === 'DROP_DOWN') && (
                          <div className="mt-2 pl-7 pt-2 border-t border-slate-100 space-y-1.5">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase">
                              Opciones de respuesta:
                            </p>
                            {(field.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs">•</span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) =>
                                    handleUpdateOption(field.id, optIdx, e.target.value)
                                  }
                                  className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg flex-1 text-slate-800 focus:outline-none focus:bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(field.id, optIdx)}
                                  className="text-slate-400 hover:text-rose-500 p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddOption(field.id)}
                              className="text-[11px] text-teal-600 hover:underline font-semibold mt-1"
                            >
                              + Agregar opción
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROPIEDADES DE TEMA DE GOOGLE FORMS (IMAGE 3) */}
            {activeTab === 'theme' && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: formTheme.themeColor || '#ff9800' }}
                  >
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Propiedades del Tema (Google Forms)</p>
                    <p className="text-slate-600">
                      Configura el estilo de texto, encabezado con logo o banner, y la paleta de colores para este formulario.
                    </p>
                  </div>
                </div>

                {/* 1. Estilo del texto */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Type className="w-4 h-4 text-slate-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Estilo del Texto
                    </h3>
                  </div>

                  {/* Encabezado */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block">Encabezado</label>
                      <span className="text-[10px] text-slate-400">Título del formulario</span>
                    </div>
                    <select
                      value={formTheme.headerFont}
                      onChange={(e) => setFormTheme({ ...formTheme, headerFont: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <select
                      value={formTheme.headerFontSize}
                      onChange={(e) => setFormTheme({ ...formTheme, headerFontSize: Number(e.target.value) })}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {[18, 20, 22, 24, 28, 32].map((s) => (
                        <option key={s} value={s}>{s} pt</option>
                      ))}
                    </select>
                  </div>

                  {/* Pregunta */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block">Pregunta</label>
                      <span className="text-[10px] text-slate-400">Títulos de cada campo</span>
                    </div>
                    <select
                      value={formTheme.questionFont}
                      onChange={(e) => setFormTheme({ ...formTheme, questionFont: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <select
                      value={formTheme.questionFontSize}
                      onChange={(e) => setFormTheme({ ...formTheme, questionFontSize: Number(e.target.value) })}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {[11, 12, 13, 14, 16, 18].map((s) => (
                        <option key={s} value={s}>{s} pt</option>
                      ))}
                    </select>
                  </div>

                  {/* Texto */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block">Texto</label>
                      <span className="text-[10px] text-slate-400">Descripciones y respuestas</span>
                    </div>
                    <select
                      value={formTheme.textFont}
                      onChange={(e) => setFormTheme({ ...formTheme, textFont: e.target.value })}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <select
                      value={formTheme.textFontSize}
                      onChange={(e) => setFormTheme({ ...formTheme, textFontSize: Number(e.target.value) })}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {[9, 10, 11, 12, 13, 14].map((s) => (
                        <option key={s} value={s}>{s} pt</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Encabezado (Imagen / Logo) */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Encabezado
                    </h3>
                  </div>

                  {formTheme.headerImageUrl ? (
                    <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={formTheme.headerImageUrl}
                          alt="Banner encabezado"
                          className="h-12 w-24 object-contain rounded-lg bg-white p-1 border border-slate-200"
                        />
                        <span className="text-xs font-semibold text-slate-800">
                          {formTheme.headerImageName || 'Imagen de encabezado configurada'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormTheme({ ...formTheme, headerImageUrl: null, headerImageName: undefined })}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const res = ev.target?.result as string;
                            if (res) {
                              setFormTheme({
                                ...formTheme,
                                headerImageUrl: res,
                                headerImageName: file.name,
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Elegir Imagen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Enlace URL</span>
                      </button>
                    </div>
                  )}

                  {showUrlInput && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://ejemplo.com/logo.png"
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!imageUrlInput.trim()) return;
                          setFormTheme({
                            ...formTheme,
                            headerImageUrl: imageUrlInput.trim(),
                            headerImageName: 'Imagen URL',
                          });
                          setImageUrlInput('');
                          setShowUrlInput(false);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Color */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Sliders className="w-4 h-4 text-slate-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Color de Tema y Fondo
                    </h3>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {GOOGLE_FORMS_PALETTE.map((pal) => {
                      const isSelected = formTheme.themeColor?.toLowerCase() === pal.hex.toLowerCase();
                      return (
                        <button
                          key={pal.hex}
                          type="button"
                          onClick={() =>
                            setFormTheme({
                              ...formTheme,
                              themeColor: pal.hex,
                              backgroundColor: `${pal.hex}15`,
                            })
                          }
                          title={pal.name}
                          className={`h-9 rounded-xl flex items-center justify-center transition-transform cursor-pointer ${
                            isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-105' : ''
                          }`}
                          style={{ backgroundColor: pal.hex }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-xs text-slate-600 font-semibold">Hexadecimal:</label>
                    <input
                      type="color"
                      value={formTheme.themeColor || '#ff9800'}
                      onChange={(e) =>
                        setFormTheme({
                          ...formTheme,
                          themeColor: e.target.value,
                          backgroundColor: `${e.target.value}15`,
                        })
                      }
                      className="w-8 h-7 rounded border border-slate-300 p-0.5 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600 uppercase">
                      {formTheme.themeColor}
                    </span>
                  </div>
                </div>
              </div>
            )}


            {/* Submit Bar */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Las respuestas se capturarán desde el enlace público oficial de Google Forms.
              </span>

              <div className="flex items-center gap-2">
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
                  style={{ backgroundColor: formTheme.themeColor || currentTheme.primaryHex }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? 'Creando en Google Forms...' : 'Crear en Google Forms'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showConfirm}
        title="¿Crear formulario dinámico en Google Forms?"
        description={`Se generará el formulario "${title}" en su cuenta oficial de Google con ${fields.length} campos configurados y estilo de tema personalizado.`}
        confirmLabel="Confirmar y Crear en Google Forms"
        cancelLabel="Revisar"
        isLoading={isLoading}
        details={[
          `Título: ${title}`,
          `Campos: ${fields.map((f) => f.title).join(', ')}`,
          `Estilo de Texto: Encabezado (${formTheme.headerFont} ${formTheme.headerFontSize}pt), Preguntas (${formTheme.questionFont} ${formTheme.questionFontSize}pt)`,
          `Color de Tema: ${formTheme.themeColor}`,
          formTheme.headerImageUrl ? 'Imagen de encabezado / Logo incluida' : 'Sin imagen de encabezado',
          'Los ciudadanos responderán desde el enlace de Google Forms',
        ]}
        onConfirm={handleConfirmedCreate}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};
