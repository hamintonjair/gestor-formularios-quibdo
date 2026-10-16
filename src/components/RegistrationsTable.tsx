import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  Copy,
  Check,
  Calendar,
  Mail,
  User,
  ArrowUpDown,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  UserPlus,
} from 'lucide-react';
import { RegistrationRecord, GoogleDriveFile } from '../types/forms';
import { formatDate } from '../services/formsApi';
import { useAppTheme } from '../context/ThemeContext';

interface RegistrationsTableProps {
  records: RegistrationRecord[];
  formResponderUrl?: string;
  formTitle?: string;
  formId?: string;
  linkedSpreadsheet?: GoogleDriveFile | null;
  onSelectRecord: (record: RegistrationRecord) => void;
  onOpenDynamicRecordModal: () => void;
  isLoading: boolean;
}

export const RegistrationsTable = ({
  records,
  formResponderUrl,
  formTitle,
  formId,
  linkedSpreadsheet,
  onSelectRecord,
  onOpenDynamicRecordModal,
  isLoading,
}: RegistrationsTableProps) => {
  const { formTheme, currentTheme } = useAppTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [sortField, setSortField] = useState<'nombre' | 'correo' | 'fecha'>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const themeHex = formTheme.themeColor || currentTheme.primaryHex;

  // Filter & Search logic
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch =
        !query ||
        rec.nombre.toLowerCase().includes(query) ||
        rec.correo.toLowerCase().includes(query) ||
        (rec.documento && rec.documento.toLowerCase().includes(query)) ||
        (rec.telefono && rec.telefono.toLowerCase().includes(query)) ||
        rec.fechaRegistro.toLowerCase().includes(query) ||
        Object.values(rec.rawAnswers).some((ans) =>
          ans.answerText.toLowerCase().includes(query)
        );

      if (!matchSearch) return false;

      if (dateFilter === 'all') return true;

      const recordDate = new Date(rec.fechaRegistro || rec.submittedAt);
      if (isNaN(recordDate.getTime())) return true;

      const now = new Date();
      const diffMs = now.getTime() - recordDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (dateFilter === 'today') {
        return (
          recordDate.getDate() === now.getDate() &&
          recordDate.getMonth() === now.getMonth() &&
          recordDate.getFullYear() === now.getFullYear()
        );
      }
      if (dateFilter === '7days') return diffDays <= 7;
      if (dateFilter === '30days') return diffDays <= 30;

      return true;
    });
  }, [records, searchTerm, dateFilter]);

  // Sort logic
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'nombre') {
        valA = a.nombre.toLowerCase();
        valB = b.nombre.toLowerCase();
      } else if (sortField === 'correo') {
        valA = a.correo.toLowerCase();
        valB = b.correo.toLowerCase();
      } else {
        const dateA = new Date(a.fechaRegistro || a.submittedAt).getTime() || 0;
        const dateB = new Date(b.fechaRegistro || b.submittedAt).getTime() || 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }

      const cmp = valA.localeCompare(valB);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredRecords, sortField, sortOrder]);

  // Pagination logic
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return sortedRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [sortedRecords, currentPage]);

  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  const toggleSort = (field: 'nombre' | 'correo' | 'fecha') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };


  // Export to Excel with bold headers and structured formatting
  const handleExportExcel = () => {
    if (sortedRecords.length === 0) return;

    const extraQuestions = new Set<string>();
    sortedRecords.forEach((r) => {
      Object.values(r.rawAnswers).forEach((ans) => {
        if (
          !ans.questionTitle.toLowerCase().includes('nombre') &&
          !ans.questionTitle.toLowerCase().includes('correo') &&
          !ans.questionTitle.toLowerCase().includes('fecha')
        ) {
          extraQuestions.add(ans.questionTitle);
        }
      });
    });
    const extraQuestionsArray = Array.from(extraQuestions);

    const headers = [
      'Nombre',
      'Correo Electrónico',
      'Fecha de Registro',
      'Documento / Cédula',
      'Teléfono',
      ...extraQuestionsArray,
      'Fecha de Envío',
    ];

    const rows = sortedRecords.map((r) => {
      const extraAnswersMap: Record<string, string> = {};
      Object.values(r.rawAnswers).forEach((ans) => {
        extraAnswersMap[ans.questionTitle] = ans.answerText;
      });

      return [
        r.nombre || '',
        r.correo || '',
        r.fechaRegistro || '',
        r.documento || '',
        r.telefono || '',
        ...extraQuestionsArray.map((q) => extraAnswersMap[q] || ''),
        r.submittedAt,
      ];
    });

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; width: 100%; }
          th {
            background-color: #673ab7;
            color: #ffffff;
            font-weight: bold;
            font-family: Arial, sans-serif;
            font-size: 11pt;
            border: 1px solid #512da8;
            padding: 10px 14px;
            text-align: left;
            mso-number-format: "\@";
            vertical-align: middle;
          }
          td {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            text-align: left;
            mso-number-format: "\@";
            vertical-align: middle;
          }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${row
                    .map((cell) => `<td>${escapeHtml(cell)}</td>`)
                    .join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `registros_google_forms_${new Date().toISOString().slice(0, 10)}.xls`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy email list
  const handleCopyEmails = () => {
    const validEmails = sortedRecords
      .map((r) => r.correo)
      .filter((e) => e && e.includes('@') && e !== 'No especificado');
    const unique = Array.from(new Set(validEmails));
    navigator.clipboard.writeText(unique.join(', '));
    setCopiedEmails(true);
    setTimeout(() => setCopiedEmails(false), 2000);
  };

  const spreadsheetUrl = linkedSpreadsheet?.webViewLink
    ? linkedSpreadsheet.webViewLink
    : formId
    ? `https://docs.google.com/forms/d/${formId}/edit#responses`
    : null;

  return (
    <div
      className="rounded-3xl border shadow-2xs overflow-hidden transition-all backdrop-blur-xs"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: `${themeHex}30`,
      }}
    >
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, correo, fecha o campos dinámicos..."
              className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">






            <button
              type="button"
              onClick={handleCopyEmails}
              disabled={records.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              title="Copiar lista de correos electrónicos"
            >
              {copiedEmails ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiados!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Correos</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={sortedRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              title="Descargar listado estructurado para Microsoft Excel con cabecera en negrita (.xls)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Excel Estructurado</span>
            </button>
          </div>
        </div>

        {/* Date Filter & Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500 mr-1">Filtrar fecha:</span>
            {(['all', 'today', '7days', '30days'] as const).map((filterKey) => {
              const labels = {
                all: `Todos (${records.length})`,
                today: 'Hoy',
                '7days': 'Últimos 7 días',
                '30days': 'Últimos 30 días',
              };
              const isSelected = dateFilter === filterKey;
              return (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setDateFilter(filterKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={{
                    backgroundColor: isSelected ? themeHex : undefined,
                  }}
                >
                  {labels[filterKey]}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500">
            Mostrando <span className="font-bold text-slate-800">{sortedRecords.length}</span> de{' '}
            <span className="font-bold text-slate-800">{records.length}</span> registros
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {/* 1. Nombre */}
              <th className="py-3 px-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => toggleSort('nombre')}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-bold cursor-pointer"
                >
                  <User
                    className="w-3.5 h-3.5"
                    style={{ color: themeHex }}
                  />
                  <span>Nombre Completo</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              {/* 2. Correo Electrónico */}
              <th className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort('correo')}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-bold cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Correo Electrónico</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              {/* 3. Fecha de Registro */}
              <th className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort('fecha')}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase font-bold cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fecha de Registro</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              {/* Campos Adicionales Dinámicos */}
              <th className="py-3 px-4 hidden md:table-cell">
                <span>Campos Dinámicos / Documento</span>
              </th>

              {/* Acciones */}
              <th className="py-3 px-4 sm:px-6 text-right">
                <span>Acciones</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div
                      className="w-7 h-7 border-3 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: themeHex, borderTopColor: 'transparent' }}
                    />
                    <p className="font-medium text-slate-600">
                      Sincronizando respuestas desde Google Forms...
                    </p>
                  </div>
                </td>
              </tr>
            ) : sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                      style={{
                        backgroundColor: `${themeHex}15`,
                        color: themeHex,
                      }}
                    >
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                      {searchTerm || dateFilter !== 'all'
                        ? 'No se encontraron registros con los filtros aplicados'
                        : 'Aún no hay respuestas en este formulario'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {searchTerm || dateFilter !== 'all'
                        ? 'Intenta restablecer la búsqueda o el filtro de fecha.'
                        : 'Los ciudadanos responderán a través del formulario de Google Forms.'}
                    </p>

                    <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">



                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Nombre */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: themeHex }}
                      >
                        {record.nombre ? record.nombre.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 group-hover:opacity-80 transition-opacity">
                          {record.nombre}
                        </p>
                        {record.rawAnswers && Object.keys(record.rawAnswers).length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{Object.keys(record.rawAnswers).length - 3} datos adicionales
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Correo Electrónico */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`mailto:${record.correo}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px]"
                      >
                        {record.correo}
                      </a>
                    </div>
                  </td>

                  {/* Fecha de Registro */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formatDate(record.fechaRegistro)}
                    </span>
                  </td>

                  {/* Documento / Campos dinámicos */}
                  <td className="py-3.5 px-4 hidden md:table-cell text-xs text-slate-600">
                    <div className="space-y-0.5">
                      {record.documento && (
                        <p className="font-medium text-slate-800">
                          CC/Doc: {record.documento}
                        </p>
                      )}
                      {record.telefono && (
                        <p className="text-slate-500">
                          Tel: {record.telefono}
                        </p>
                      )}
                      {!record.documento && !record.telefono && (
                        <span className="text-slate-400 italic">
                          {Object.values(record.rawAnswers).length > 3
                            ? `${Object.values(record.rawAnswers)[3]?.questionTitle}: ${Object.values(record.rawAnswers)[3]?.answerText}`
                            : '—'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecord(record);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ver Detalle</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
          >
            Anterior
          </button>
          <span className="text-xs text-slate-600">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Footer bar */}
      {records.length > 0 && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {formTitle ? `Formulario: ${formTitle}` : 'Google Forms Activo'}
          </span>
          <div className="flex items-center gap-3">
            <span>·</span>
            <span>Campos obligatorios: Nombre · Correo electrónico · Fecha de registro</span>
          </div>
        </div>
      )}
    </div>
  );
};
