import React, { useState, ErrorInfo } from 'react';
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 bg-rose-50 text-rose-800 rounded-xl">Algo salió mal al cargar el componente.</div>;
    }
    return this.props.children;
  }
}

import {
  ExternalLink,
  FileSpreadsheet,
  Eye,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  Upload,
} from 'lucide-react';
import { GoogleDriveFile, GoogleFormSchema } from '../types/forms';
import { useAppTheme } from '../context/ThemeContext';

interface ActiveFormDisplayCardProps {
  currentForm: GoogleFormSchema;
  linkedSpreadsheet: GoogleDriveFile | null;
}

export const ActiveFormDisplayCard: React.FC<ActiveFormDisplayCardProps> = ({
  currentForm,
  linkedSpreadsheet,
}) => {
  const { formTheme, currentTheme } = useAppTheme();
  const [copiedLink, setCopiedLink] = useState(false);

  const themeHex = formTheme.themeColor || currentTheme.primaryHex;
  const bgHex = formTheme.backgroundColor || '#f8fafc';

  const spreadsheetUrl = linkedSpreadsheet?.webViewLink
    ? linkedSpreadsheet.webViewLink
    : `https://docs.google.com/forms/d/${currentForm.formId}/edit#responses`;

  const handleCopyLink = () => {
    if (!currentForm.responderUri) return;
    navigator.clipboard.writeText(currentForm.responderUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Google Forms items / questions
  const items = currentForm.items || [];

  return (
    <ErrorBoundary>
      <div
        className="rounded-3xl border shadow-sm overflow-hidden transition-all backdrop-blur-xs"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: `${themeHex}30`,
        }}
      >
        {/* Themed accent bar */}
        <div className="h-2.5 w-full" style={{ backgroundColor: themeHex }} />

        {/* 3. Form Info Header & Controls Bar */}
        <div
          className="p-5 sm:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{
            backgroundColor: `${themeHex}06`,
            borderBottomColor: `${themeHex}20`,
          }}
        >
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: `${themeHex}12`,
                  color: themeHex,
                  borderColor: `${themeHex}30`,
                }}
              >
                Formulario Activo en la Web
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {currentForm.formId}
              </span>
              {formTheme.headerFont && (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                  Tipografía: {formTheme.headerFont} ({formTheme.headerFontSize}pt)
                </span>
              )}
            </div>

            <h2
              className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight"
              style={{
                fontFamily: formTheme.headerFont || 'inherit',
                fontSize: `${formTheme.headerFontSize || 22}px`,
              }}
            >
              {currentForm.info.title || 'Formulario Oficial'}
            </h2>

            <p
              className="text-xs sm:text-sm text-slate-600 leading-relaxed"
              style={{
                fontFamily: formTheme.textFont || 'inherit',
                fontSize: `${formTheme.textFontSize || 11}px`,
              }}
            >
              {currentForm.info.description ||
                'Formulario dinámico oficial para la captura y seguimiento de datos con campos auditados.'}
            </p>
          </div>

          {/* View Switcher & Action buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <a
              href={`https://docs.google.com/forms/d/${currentForm.formId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs"
              title="Abrir formulario en Google Forms para personalizar tema directamente en Google"
            >
              <span>Personalizar en Google Forms</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* 4. Tab 1: Form Questions with Theme Applied */}
        <div
          className="p-5 sm:p-7 space-y-4 transition-colors"
          style={{ backgroundColor: bgHex }}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">
              Campos del Formulario ({items.length} preguntas configuradas)
            </span>
            <div className="flex items-center gap-2">
              {currentForm.responderUri && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">¡Enlace copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar enlace para responder</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3.5 max-w-3xl">
            {items.map((item, index) => {
              const q = item.questionItem?.question;
              const isRequired = q?.required;
              return (
                <div
                  key={item.itemId || index}
                  className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <label
                      className="font-bold text-slate-900 block leading-snug"
                      style={{
                        fontFamily: formTheme.questionFont || 'inherit',
                        fontSize: `${formTheme.questionFontSize || 14}px`,
                      }}
                    >
                      {item.title || `Campo ${index + 1}`}
                      {isRequired && <span className="text-rose-500 ml-1">*</span>}
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
                      #{index + 1}
                    </span>
                  </div>

                  {item.description && (
                    <p
                      className="text-slate-500 text-xs"
                      style={{
                        fontFamily: formTheme.textFont || 'inherit',
                        fontSize: `${Math.max((formTheme.textFontSize || 11) - 1, 10)}px`,
                      }}
                    >
                      {item.description}
                    </p>
                  )}

                  {/* Input placeholder styling */}
                  <div className="pt-1">
                    {q?.choiceQuestion ? (
                      <div className="space-y-2 pt-1">
                        {q.choiceQuestion.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2 text-xs text-slate-700">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0" />
                            <span>{opt.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : q?.dateQuestion ? (
                      <div className="h-9 max-w-xs bg-slate-50/70 border-b-2 border-slate-300 px-3 text-xs text-slate-400 flex items-center justify-between rounded-t">
                        <span>AAAA-MM-DD</span>
                        <span className="text-slate-400 text-[10px]">Fecha</span>
                      </div>
                    ) : (
                      <div className="h-9 bg-slate-50/70 border-b-2 border-slate-300 px-3 text-xs text-slate-400 flex items-center rounded-t">
                        <span>Texto de respuesta corta</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Theme properties summary bar */}
          <div className="p-3 bg-white/80 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">Tema aplicado en la web:</span>
              <span className="inline-flex items-center gap-1 font-medium">
                <span
                  className="w-3 h-3 rounded-full inline-block border border-black/10"
                  style={{ backgroundColor: themeHex }}
                />
                Color: {themeHex}
              </span>
              <span>•</span>
              <span>Encabezado: {formTheme.headerFont} ({formTheme.headerFontSize}pt)</span>
              <span>•</span>
              <span>Preguntas: {formTheme.questionFont} ({formTheme.questionFontSize}pt)</span>
              <span>•</span>
              <span>Texto: {formTheme.textFont} ({formTheme.textFontSize}pt)</span>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
