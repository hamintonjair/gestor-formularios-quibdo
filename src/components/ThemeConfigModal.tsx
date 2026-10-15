import React, { useState, useRef } from 'react';
import {
  X,
  Palette,
  Type,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Sliders,
  CheckCircle2,
  Trash2,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  FONT_OPTIONS,
  GOOGLE_FORMS_PALETTE,
  THEME_PRESETS,
  ThemeId,
  GoogleFormThemeProperties,
} from '../types/theme';
import { GoogleFormSchema } from '../types/forms';
import { useAppTheme } from '../context/ThemeContext';

interface ThemeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentForm: GoogleFormSchema | null;
  onInsertBannerToGoogleForm?: (imageUrl: string) => Promise<void>;
}

export const ThemeConfigModal: React.FC<ThemeConfigModalProps> = ({
  isOpen,
  onClose,
  currentForm,
  onInsertBannerToGoogleForm,
}) => {
  const {
    branding,
    formTheme,
    updateFormTheme,
    setTheme,
    saveFormThemeForId,
    resetBranding,
  } = useAppTheme();

  const [activeTab, setActiveTab] = useState<'style' | 'header' | 'color' | 'presets' | 'googleForms'>('style');
  const [customColor, setCustomColor] = useState(formTheme.themeColor || '#ff9800');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isInsertingBanner, setIsInsertingBanner] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleColorChange = (hex: string) => {
    setCustomColor(hex);
    // Derive a harmonious light background color
    const derivedBg = `${hex}15`;
    updateFormTheme({
      themeColor: hex,
      backgroundColor: derivedBg,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG o WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateFormTheme({
          headerImageUrl: result,
          headerImageName: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrlImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    updateFormTheme({
      headerImageUrl: imageUrlInput.trim(),
      headerImageName: 'Encabezado web',
    });
    setImageUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemoveImage = () => {
    updateFormTheme({
      headerImageUrl: null,
      headerImageName: undefined,
    });
  };

  const handleSaveForCurrentForm = () => {
    if (currentForm?.formId) {
      saveFormThemeForId(currentForm.formId);
    }
    onClose();
  };

  const handleInsertBanner = async () => {
    if (!formTheme.headerImageUrl || !onInsertBannerToGoogleForm) return;
    setIsInsertingBanner(true);
    try {
      await onInsertBannerToGoogleForm(formTheme.headerImageUrl);
      setBannerSuccess(true);
      setTimeout(() => setBannerSuccess(false), 4000);
    } catch (e) {
      console.error('Error inserting banner into form:', e);
    } finally {
      setIsInsertingBanner(false);
    }
  };

  const googleFormsEditUrl = currentForm?.formId
    ? `https://docs.google.com/forms/d/${currentForm.formId}/edit`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: formTheme.themeColor }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Configuración del Tema
              </h2>
              <p className="text-xs text-slate-500">
                Personaliza la apariencia en esta plataforma y sincroniza con Google Forms
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Banner about Google Forms API Theme limitation & Direct Link */}
        {googleFormsEditUrl && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 min-w-0">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">
                  ¿Cómo se aplica el tema en Google Forms?
                </p>
                <p className="text-amber-800 text-[11px] leading-snug">
                  La API oficial de Google no permite cambiar el color ni fuentes de la web de Google Forms de forma remota. El tema configurado aquí se aplica en esta plataforma, y puedes reflejarlo en Google Forms con 1 clic en su editor.
                </p>
              </div>
            </div>
            <a
              href={googleFormsEditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shrink-0 transition-colors shadow-xs text-xs"
            >
              <span>Abrir en Google Forms</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6 overflow-x-auto mt-2">
          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'style'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Estilo del Texto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('header')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'header'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Encabezado</span>
            {formTheme.headerImageUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('color')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'color'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Color y Fondo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Temas Institucionales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('googleForms')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'googleForms'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>Aplicar en Google Forms</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: ESTILO DEL TEXTO (TIPOGRAFÍA) */}
          {activeTab === 'style' && (
            <div className="space-y-5 animate-in fade-in duration-100">
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold mb-0.5">Estilo del Texto (Google Forms)</p>
                Define la tipografía y tamaño de letra que identificará los encabezados, las preguntas y el texto secundario de tus formularios.
              </div>

              {/* Encabezado */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Encabezado
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formTheme.headerFont} • {formTheme.headerFontSize} pt
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={formTheme.headerFont}
                    onChange={(e) => updateFormTheme({ headerFont: e.target.value })}
                    className="sm:col-span-2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formTheme.headerFontSize}
                    onChange={(e) => updateFormTheme({ headerFontSize: Number(e.target.value) })}
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {[18, 20, 22, 24, 28, 32].map((sz) => (
                      <option key={sz} value={sz}>
                        {sz} pt
                      </option>
                    ))}
                  </select>
                </div>
                <p
                  className="mt-2 text-slate-800 font-bold truncate pt-1 border-t border-slate-200/60"
                  style={{
                    fontFamily: formTheme.headerFont,
                    fontSize: `${formTheme.headerFontSize}px`,
                  }}
                >
                  Vista previa: {currentForm?.info.title || 'Título del Formulario'}
                </p>
              </div>

              {/* Pregunta */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pregunta
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formTheme.questionFont} • {formTheme.questionFontSize} pt
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={formTheme.questionFont}
                    onChange={(e) => updateFormTheme({ questionFont: e.target.value })}
                    className="sm:col-span-2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formTheme.questionFontSize}
                    onChange={(e) => updateFormTheme({ questionFontSize: Number(e.target.value) })}
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {[11, 12, 13, 14, 16, 18].map((sz) => (
                      <option key={sz} value={sz}>
                        {sz} pt
                      </option>
                    ))}
                  </select>
                </div>
                <p
                  className="mt-2 text-slate-800 font-semibold truncate pt-1 border-t border-slate-200/60"
                  style={{
                    fontFamily: formTheme.questionFont,
                    fontSize: `${formTheme.questionFontSize}px`,
                  }}
                >
                  Vista previa: ¿Cuál es su número de identificación?
                </p>
              </div>

              {/* Texto */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Texto de Respuesta / Instrucciones
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formTheme.textFont} • {formTheme.textFontSize} pt
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={formTheme.textFont}
                    onChange={(e) => updateFormTheme({ textFont: e.target.value })}
                    className="sm:col-span-2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formTheme.textFontSize}
                    onChange={(e) => updateFormTheme({ textFontSize: Number(e.target.value) })}
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {[9, 10, 11, 12, 13, 14].map((sz) => (
                      <option key={sz} value={sz}>
                        {sz} pt
                      </option>
                    ))}
                  </select>
                </div>
                <p
                  className="mt-2 text-slate-600 truncate pt-1 border-t border-slate-200/60"
                  style={{
                    fontFamily: formTheme.textFont,
                    fontSize: `${formTheme.textFontSize}px`,
                  }}
                >
                  Vista previa: Diligencie el campo de acuerdo a su documento oficial.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ENCABEZADO (IMAGEN / LOGO) */}
          {activeTab === 'header' && (
            <div className="space-y-5 animate-in fade-in duration-100">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900 mb-0.5">Encabezado del Formulario</p>
                Agrega un logo o banner oficial que aparecerá en el encabezado de tus formularios.
              </div>

              {formTheme.headerImageUrl ? (
                <div className="space-y-3">
                  <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 p-2 flex items-center justify-center max-h-48">
                    <img
                      src={formTheme.headerImageUrl}
                      alt="Banner o logo del encabezado"
                      className="max-h-44 max-w-full object-contain rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="Quitar encabezado"
                      className="absolute top-3 right-3 p-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>{formTheme.headerImageName || 'Imagen de encabezado activa'}</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Eliminar imagen
                    </button>
                  </div>

                  {/* Send banner to Google Form if applicable */}
                  {currentForm && onInsertBannerToGoogleForm && formTheme.headerImageUrl.startsWith('http') && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-emerald-900">Insertar en Google Forms oficial</p>
                        <p className="text-emerald-700 text-[11px]">
                          Esta imagen tiene enlace público y puede insertarse en el encabezado de Google Forms.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleInsertBanner}
                        disabled={isInsertingBanner}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {isInsertingBanner ? 'Insertando...' : bannerSuccess ? '¡Insertado!' : 'Insertar en Google'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center space-y-3 bg-slate-50/50">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Elegir imagen de encabezado
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sube un logo institucional (PNG, JPG, SVG) o proporciona una URL directa
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Subir Imagen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <LinkIcon className="w-4 h-4 text-slate-500" />
                      <span>Ingresar Enlace URL</span>
                    </button>
                  </div>
                </div>
              )}

              {showUrlInput && (
                <form
                  onSubmit={handleApplyUrlImage}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2 animate-in fade-in"
                >
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://ejemplo.com/logo.png"
                    className="flex-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="submit"
                      disabled={!imageUrlInput.trim()}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Aplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: COLOR DEL TEMA Y FONDO */}
          {activeTab === 'color' && (
            <div className="space-y-5 animate-in fade-in duration-100">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900 mb-0.5">Color del Tema y Fondo</p>
                Selecciona de la paleta oficial de Google Forms o personaliza el tono con tu código hexadecimal preferido.
              </div>

              {/* Official Google Forms Palette */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Paleta de Colores de Google Forms
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                  {GOOGLE_FORMS_PALETTE.map((pal) => {
                    const isSelected = formTheme.themeColor?.toLowerCase() === pal.hex.toLowerCase();
                    return (
                      <button
                        key={pal.hex}
                        type="button"
                        onClick={() => handleColorChange(pal.hex)}
                        title={pal.name}
                        className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition-transform hover:scale-105 cursor-pointer shadow-xs ${
                          isSelected ? 'ring-3 ring-offset-2 ring-slate-800' : ''
                        }`}
                        style={{ backgroundColor: pal.hex }}
                      >
                        {isSelected && <Check className="w-5 h-5 text-white drop-shadow-sm" />}
                        <span className="sr-only">{pal.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Hex Color Picker */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Color Personalizado
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-12 h-10 rounded-xl border border-slate-300 p-0.5 cursor-pointer bg-white"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formTheme.themeColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      placeholder="#ff9800"
                      className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Background Color Preview */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-2" style={{ backgroundColor: formTheme.backgroundColor || '#fff8e1' }}>
                <p className="text-xs font-bold text-slate-800">
                  Vista Previa del Fondo del Formulario
                </p>
                <p className="text-xs text-slate-600">
                  El fondo se adapta armónicamente al color de tema seleccionado ({formTheme.backgroundColor}).
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: TEMAS INSTITUCIONALES PRECONFIGURADOS */}
          {activeTab === 'presets' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900 mb-0.5">Preajustes Institucionales</p>
                Aplica con un solo clic los estilos institucionales diseñados para la gestión territorial y comunitaria.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(THEME_PRESETS).map((preset) => {
                  const isCurrent = branding.themeId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setTheme(preset.id as ThemeId)}
                      className={`p-3.5 text-left rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                        isCurrent
                          ? 'border-slate-800 bg-white shadow-md'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-xs"
                            style={{ backgroundColor: preset.primaryHex }}
                          />
                          <span className="text-xs font-bold text-slate-900">
                            {preset.name}
                          </span>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: APLICAR EN GOOGLE FORMS (GUÍA PASO A PASO) */}
          {activeTab === 'googleForms' && (
            <div className="space-y-5 animate-in fade-in duration-100">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
                <h3 className="font-bold text-sm text-amber-950 mb-1">
                  ¿Por qué Google Forms requiere aplicar el color desde su editor?
                </h3>
                <p>
                  Google diseñó la API de Google Forms (v1) para permitir crear preguntas, recibir respuestas y colocar imágenes, pero <strong>no incluyó en su API pública la capacidad de modificar de forma remota los colores y fuentes nativas de docs.google.com</strong>.
                </p>
                <p className="mt-1.5 font-medium">
                  El tema configurado aquí se aplica en esta plataforma web (en todas las tarjetas, formularios embebidos, vistas de registro y tipografías). Para que la página pública de Google Forms tenga exactamente el mismo color, solo debes seguir estos 3 pasos rápidos:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">
                      Abre el editor oficial de tu formulario en Google Forms
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Haz clic en el botón de abajo para ir directamente al formulario en tu cuenta de Google.
                    </p>
                    {googleFormsEditUrl ? (
                      <a
                        href={googleFormsEditUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
                      >
                        <span>Abrir Formulario en Google Forms</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic mt-1 block">
                        Selecciona o abre un formulario primero para acceder al enlace directo.
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">
                      Haz clic en el icono de la Paleta (Tema)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      En la esquina superior derecha de Google Forms verás el icono con forma de paleta de pintor ("Personalizar tema").
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">
                      Selecciona el color y la tipografía configurados
                    </p>
                    <div className="mt-2 p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Color seleccionado:</span>
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block border border-black/10"
                          style={{ backgroundColor: formTheme.themeColor }}
                        />
                        <span className="font-mono">{formTheme.themeColor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Fuente Encabezado:</span>
                        <span>{formTheme.headerFont} ({formTheme.headerFontSize}pt)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Fuente Preguntas:</span>
                        <span>{formTheme.questionFont} ({formTheme.questionFontSize}pt)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetBranding}
            title="Restablecer tema a valores iniciales"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSaveForCurrentForm}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer"
              style={{ backgroundColor: formTheme.themeColor }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar y Aplicar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
