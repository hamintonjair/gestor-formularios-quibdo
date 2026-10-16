/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  googleSignInRedirect,
  logout,
  getAccessToken,
  setCachedAccessToken,
} from './services/auth';
import {
  listDriveForms,
  getFormDetails,
  getFormResponses,
  createCustomRegistrationForm,
  addQuestionsToExistingForm,
  addHeaderImageToExistingForm,
  deleteFormFromDrive,
  findLinkedSpreadsheet,
  parseRegistrationRecords,
  extractFormId,
  GoogleApiAuthError,
} from './services/formsApi';
import { MeetingScheduler } from './components/MeetingScheduler';
import type {
  GoogleDriveFile,
  GoogleFormSchema,
  RegistrationRecord,
  DynamicFormField,
} from './types/forms';
import type { GoogleFormThemeProperties } from './types/theme';
import { ThemeProvider, useAppTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { FormSelector } from './components/FormSelector';
import { StatsCards } from './components/StatsCards';
import { RegistrationsTable } from './components/RegistrationsTable';
import { DynamicFormBuilderModal } from './components/DynamicFormBuilderModal';
import { AddFieldModal } from './components/AddFieldModal';
import { CreateDynamicRecordModal } from './components/CreateDynamicRecordModal';
import { RegistrationDetailModal } from './components/RegistrationDetailModal';
import { ActiveFormDisplayCard } from './components/ActiveFormDisplayCard';
import { ThemeConfigModal } from './components/ThemeConfigModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ConfigurationGuide } from './components/ConfigurationGuide';
import { EmailRemindersManager } from './components/EmailRemindersManager';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  INITIAL_DEMO_DRIVE_FORMS,
  INITIAL_DEMO_SPREADSHEET,
  INITIAL_DEMO_FORMS_MAP,
} from './services/demoData';
import {
  ShieldCheck,
  AlertCircle,
  X,
  FileCheck2,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  LogIn,
  Palette,
  Building2,
  UserPlus,
  Eye,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

function Dashboard() {
  const {
    branding,
    currentTheme,
    formTheme,
    loadPropertiesFromGoogleForm,
    saveFormThemeForId,
    updateFormTheme,
  } = useAppTheme();
  const [demoFormsMap, setDemoFormsMap] = useState<
    Record<string, { schema: GoogleFormSchema; records: RegistrationRecord[] }>
  >(INITIAL_DEMO_FORMS_MAP);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentView, setCurrentView] = useState<'forms' | 'meetings' | 'guide' | 'reminders'>('forms');

  // Form & Records State
  const [driveForms, setDriveForms] = useState<GoogleDriveFile[]>([]);
  const [currentForm, setCurrentForm] = useState<GoogleFormSchema | null>(null);
  const [linkedSpreadsheet, setLinkedSpreadsheet] = useState<GoogleDriveFile | null>(null);
  const [records, setRecords] = useState<RegistrationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RegistrationRecord | null>(null);

  // Modals
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isDynamicBuilderOpen, setIsDynamicBuilderOpen] = useState(false);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [isDynamicRecordModalOpen, setIsDynamicRecordModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<GoogleDriveFile | null>(null);
  const [isDeletingForm, setIsDeletingForm] = useState(false);
  const [isOperatingForm, setIsOperatingForm] = useState(false);

  // Notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleAuthError = useCallback((err: unknown) => {
    const isAuthErr =
      err instanceof GoogleApiAuthError ||
      (err instanceof Error &&
        (err.message.includes('authentication credentials') ||
          err.message.includes('401') ||
          err.message.includes('expiraron') ||
          err.message.includes('UNAUTHENTICATED')));

    if (isAuthErr) {
      setCachedAccessToken(null);
      setToken(null);
      setNeedsAuth(true);
      setErrorMessage(
        'Tu sesión de Google Workspace ha expirado o requiere autorización para acceder a Google Forms. Por favor haz clic en "Acceder con Google Workspace".'
      );
    } else {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setErrorMessage(msg);
    }
  }, []);

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Load Form Responses and Details
  const loadFormData = useCallback(
    async (formId: string, accessTokenOverride?: string) => {
      const token = accessTokenOverride || (await getAccessToken());
      if (!token) {
        const demoData = demoFormsMap[formId];
        if (demoData) {
          setIsLoadingData(true);
          setTimeout(() => {
            setCurrentForm(demoData.schema);
            setRecords(demoData.records);
            loadPropertiesFromGoogleForm(demoData.schema);
            setIsLoadingData(false);
          }, 150);
        }
        return;
      }

      setIsLoadingData(true);
      setErrorMessage(null);

      try {
        const schema = await getFormDetails(token, formId);
        setCurrentForm(schema);
        loadPropertiesFromGoogleForm(schema);

        // Fetch responses
        const rawResponses = await getFormResponses(token, formId);
        const parsed = parseRegistrationRecords(rawResponses, schema);
        setRecords(parsed);

        // Search for linked Google Sheets spreadsheet in Drive
        const sheet = await findLinkedSpreadsheet(token, schema.info.title);
        setLinkedSpreadsheet(sheet);
      } catch (err: unknown) {
        console.error('Error loading form data:', err);
        handleAuthError(err);
      } finally {
        setIsLoadingData(false);
      }
    },
    [demoFormsMap, handleAuthError, loadPropertiesFromGoogleForm]
  );

  // 3. Load Drive Forms
  const loadDriveForms = useCallback(
    async (accessTokenOverride?: string) => {
      const token = accessTokenOverride || (await getAccessToken());
      if (!token) {
        if (user) {
          // User is logged in but token is missing (e.g., page refresh)
          setErrorMessage('Tu sesión requiere re-autorización. Por favor, haz clic en el botón de acceso nuevamente.');
        } else {
          setDriveForms(INITIAL_DEMO_DRIVE_FORMS);
        }
        return;
      }

      setIsLoadingDrive(true);
      try {
        const files = await listDriveForms(token);
        setDriveForms(files);

        if (!currentForm && files.length > 0) {
          await loadFormData(files[0].id, token);
        }
      } catch (err: unknown) {
        console.error('Error fetching drive forms:', err);
        handleAuthError(err);
      } finally {
        setIsLoadingDrive(false);
      }
    },
    [user, currentForm, loadFormData, handleAuthError]
  );

  useEffect(() => {
    if (!needsAuth && user) {
      loadDriveForms();
    }
  }, [needsAuth, user, loadDriveForms]);

  // Handle Sign In
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        showToast('Sesión autorizada exitosamente con Google Workspace');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setErrorMessage(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Redirect Sign In (fallback for blocked popups)
  const handleRedirectLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      await googleSignInRedirect();
    } catch (err: unknown) {
      console.error('Redirect login error:', err);
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión con redirección';
      setErrorMessage(message);
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setCurrentForm(null);
    setRecords([]);
    setDriveForms([]);
    setLinkedSpreadsheet(null);
    showToast('Sesión cerrada.');
  };

  // Handle manual form ID submission
  const handleManualFormId = async (input: string) => {
    const cleanId = extractFormId(input);
    if (!cleanId) {
      setErrorMessage('Por favor ingresa un ID o enlace válido de Google Forms.');
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      const demoData = demoFormsMap[cleanId];
      if (demoData) {
        await loadFormData(cleanId);
        showToast(`Formulario cargado: ${cleanId}`);
      } else {
        setErrorMessage(
          'Para importar un formulario nuevo externo con ID se requiere conectar tu cuenta de Google Workspace.'
        );
      }
      return;
    }
    await loadFormData(cleanId);
    showToast(`Formulario cargado: ${cleanId}`);
  };

  // Handle creation of custom dynamic form
  const handleCreateDynamicForm = async (
    title: string,
    description: string,
    fields: DynamicFormField[],
    themeProps?: GoogleFormThemeProperties
  ) => {
    const token = await getAccessToken();
    if (!token) {
      setIsOperatingForm(true);
      try {
        const newFormId = `form-custom-${Date.now()}`;
        const newSchema: GoogleFormSchema = {
          formId: newFormId,
          info: {
            title,
            description,
            documentTitle: title,
          },
          responderUri: `https://docs.google.com/forms/d/e/${newFormId}/viewform`,
          items: fields.map((f, idx) => ({
            itemId: `field-${idx + 1}`,
            title: f.title,
            description: f.description,
            questionItem: {
              question: {
                questionId: `q-${idx + 1}`,
                required: f.required,
                textQuestion:
                  f.type === 'TEXT' || f.type === 'PARAGRAPH'
                    ? { paragraph: f.type === 'PARAGRAPH' }
                    : undefined,
                dateQuestion: f.type === 'DATE' ? { includeYear: true } : undefined,
                choiceQuestion:
                  f.type === 'RADIO' || f.type === 'CHECKBOX' || f.type === 'DROP_DOWN'
                    ? {
                        type: f.type,
                        options: f.options?.map((opt) => ({ value: opt })) || [
                          { value: 'Opción 1' },
                        ],
                      }
                    : undefined,
              },
            },
          })),
        };

        const newFile: GoogleDriveFile = {
          id: newFormId,
          name: title,
          createdTime: new Date().toISOString(),
          modifiedTime: new Date().toISOString(),
          webViewLink: `https://docs.google.com/forms/d/${newFormId}/edit`,
        };

        setDemoFormsMap((prev) => ({
          ...prev,
          [newFormId]: { schema: newSchema, records: [] },
        }));
        setDriveForms((prev) => [newFile, ...prev]);
        setCurrentForm(newSchema);
        setRecords([]);
        setLinkedSpreadsheet(null);

        if (themeProps) {
          saveFormThemeForId(newFormId, themeProps);
          updateFormTheme(themeProps);
        }

        setIsDynamicBuilderOpen(false);
        showToast(`¡Formulario dinámico "${title}" creado y activado!`);
      } finally {
        setIsOperatingForm(false);
      }
      return;
    }

    setIsOperatingForm(true);
    setErrorMessage(null);
    try {
      const headerImageToUse = themeProps?.headerImageUrl || branding.logoUrl;
      const newForm = await createCustomRegistrationForm(
        token,
        title,
        description,
        fields,
        headerImageToUse
      );

      if (themeProps) {
        saveFormThemeForId(newForm.formId, themeProps);
        updateFormTheme(themeProps);
      }

      setIsDynamicBuilderOpen(false);
      setCurrentForm(newForm);
      showToast(`¡Formulario dinámico "${title}" creado exitosamente en Google Forms!`);

      await loadDriveForms(token);
      await loadFormData(newForm.formId, token);
    } catch (err: unknown) {
      console.error('Error creating custom dynamic form:', err);
      handleAuthError(err);
    } finally {
      setIsOperatingForm(false);
    }
  };

  // Handle adding a dynamic question to the active Google Form
  const handleAddFieldToActiveForm = async (field: DynamicFormField) => {
    if (!currentForm) return;
    const token = await getAccessToken();
    if (!token) {
      setIsOperatingForm(true);
      try {
        const newItem = {
          itemId: `item-${Date.now()}`,
          title: field.title,
          description: field.description,
          questionItem: {
            question: {
              questionId: `q-${Date.now()}`,
              required: field.required,
              textQuestion:
                field.type === 'TEXT' || field.type === 'PARAGRAPH'
                  ? { paragraph: field.type === 'PARAGRAPH' }
                  : undefined,
              dateQuestion: field.type === 'DATE' ? { includeYear: true } : undefined,
              choiceQuestion:
                field.type === 'RADIO' || field.type === 'CHECKBOX' || field.type === 'DROP_DOWN'
                  ? {
                      type: field.type,
                      options: field.options?.map((opt) => ({ value: opt })) || [
                        { value: 'Opción 1' },
                      ],
                    }
                  : undefined,
            },
          },
        };

        const updated: GoogleFormSchema = {
          ...currentForm,
          items: [...(currentForm.items || []), newItem],
        };

        setCurrentForm(updated);
        setDemoFormsMap((prev) => ({
          ...prev,
          [currentForm.formId]: {
            schema: updated,
            records: prev[currentForm.formId]?.records || records,
          },
        }));
        setIsAddFieldModalOpen(false);
        showToast(`¡Campo "${field.title}" agregado al formulario!`);
      } finally {
        setIsOperatingForm(false);
      }
      return;
    }

    setIsOperatingForm(true);
    setErrorMessage(null);
    try {
      const updated = await addQuestionsToExistingForm(
        token,
        currentForm.formId,
        [field],
        currentForm.items?.length || 0
      );
      setCurrentForm(updated);
      showToast(`¡Campo "${field.title}" agregado al formulario de Google Forms!`);
      await loadFormData(currentForm.formId, token);
    } catch (err: unknown) {
      console.error('Error adding field to form:', err);
      handleAuthError(err);
    } finally {
      setIsOperatingForm(false);
    }
  };

  // Handle inserting banner image directly to Google Forms via Forms API
  const handleInsertBannerToGoogleForm = async (imageUrl: string) => {
    if (!currentForm) return;
    const token = await getAccessToken();
    if (!token) {
      updateFormTheme({ headerImageUrl: imageUrl });
      showToast('¡Imagen de encabezado actualizada!');
      return;
    }

    setIsOperatingForm(true);
    setErrorMessage(null);
    try {
      const updated = await addHeaderImageToExistingForm(
        token,
        currentForm.formId,
        imageUrl,
        branding.institutionName
      );
      setCurrentForm(updated);
      showToast('¡Imagen de encabezado agregada exitosamente al formulario de Google Forms!');
      await loadFormData(currentForm.formId, token);
    } catch (err: unknown) {
      console.error('Error inserting banner into Google Form:', err);
      handleAuthError(err);
    } finally {
      setIsOperatingForm(false);
    }
  };

  // Handle deletion of form from Google Drive
  const handleConfirmDeleteForm = async () => {
    if (!formToDelete) return;
    const token = await getAccessToken();
    if (!token) {
      setIsDeletingForm(true);
      try {
        const deletedId = formToDelete.id;
        const remaining = driveForms.filter((f) => f.id !== deletedId);
        setDriveForms(remaining);
        setDemoFormsMap((prev) => {
          const next = { ...prev };
          delete next[deletedId];
          return next;
        });

        if (currentForm?.formId === deletedId) {
          if (remaining.length > 0) {
            const nextId = remaining[0].id;
            const nextData = demoFormsMap[nextId];
            if (nextData) {
              setCurrentForm(nextData.schema);
              setRecords(nextData.records);
              loadPropertiesFromGoogleForm(nextData.schema);
            } else {
              setCurrentForm(null);
              setRecords([]);
              setLinkedSpreadsheet(null);
            }
          } else {
            setCurrentForm(null);
            setRecords([]);
            setLinkedSpreadsheet(null);
          }
        }
        showToast(`¡Formulario "${formToDelete.name}" eliminado de la lista!`);
      } finally {
        setIsDeletingForm(false);
        setFormToDelete(null);
      }
      return;
    }

    setIsDeletingForm(true);
    setErrorMessage(null);
    try {
      await deleteFormFromDrive(token, formToDelete.id);
      showToast(`¡Formulario "${formToDelete.name}" enviado a la papelera de Google Drive!`);

      // Update local driveForms list immediately
      setDriveForms((prev) => prev.filter((f) => f.id !== formToDelete.id));

      // If deleted form was active, reset current form
      if (currentForm?.formId === formToDelete.id) {
        setCurrentForm(null);
        setRecords([]);
        setLinkedSpreadsheet(null);
      }

      // Refresh drive forms list
      await loadDriveForms(token);
    } catch (err: unknown) {
      console.error('Error deleting form from drive:', err);
      handleAuthError(err);
    } finally {
      setIsDeletingForm(false);
      setFormToDelete(null);
    }
  };

  // Handle record added
  const handleAddRecord = (newRec: RegistrationRecord) => {
    setRecords((prev) => [newRec, ...prev]);
    if (currentForm) {
      setDemoFormsMap((prev) => {
        const cur = prev[currentForm.formId];
        if (!cur) return prev;
        return {
          ...prev,
          [currentForm.formId]: {
            ...cur,
            records: [newRec, ...cur.records],
          },
        };
      });
    }
    showToast(`¡Registro para "${newRec.nombre}" completado y guardado!`);
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    const token = await getAccessToken();
    if (currentForm && token) {
      await loadFormData(currentForm.formId);
      showToast('Registros actualizados desde Google Forms');
    } else {
      showToast('Registros actualizados');
    }
  };

  // 4. Render Unauthenticated View
  if (needsAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-100 flex flex-col justify-between text-slate-800">
        {/* Top Header Bar */}
        <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt="Logo institucional"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: currentTheme.primaryHex }}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {branding.institutionName}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {branding.subHeader}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Integración Segura
              </span>
            </div>
          </div>
        </div>

        {/* Central Sign-In Container */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
            <div
              className={`p-8 text-white relative bg-gradient-to-r ${currentTheme.headerGradient}`}
            >
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/20 text-white mb-3 backdrop-blur-xs">
                  Acceso Institucional
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Formularios y Registros Dinámicos
                </h2>
                <p className="mt-2 text-white/90 text-xs sm:text-sm leading-relaxed">
                  Cree formularios adaptados a cada necesidad institucional de manera ágil y personalizada.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-900">Autorización requerida</p>
                    <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Official Google Sign In Button */}
              <div className="flex flex-col items-center gap-3.5 pt-2">
                <GoogleSignInButton
                  onClick={handleLogin}
                  loading={isLoggingIn}
                  disabled={isLoggingIn}
                  text="Acceder con Google Workspace"
                />
                <button
                  type="button"
                  onClick={handleRedirectLogin}
                  disabled={isLoggingIn}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  ¿Problemas con la ventana emergente? Acceder con Redirección
                </button>
                <p className="text-[11px] text-slate-500 text-center max-w-xs leading-relaxed">
                  Inicia sesión con tu cuenta de Google Workspace para autorizar el acceso y sincronizar tus formularios de Google Forms y Google Drive.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/40">
          {branding.subHeader}
        </footer>
      </div>
    );
  }

  // 5. Render Authenticated Dashboard
  const activeThemeHex = formTheme.themeColor || currentTheme.primaryHex;
  const activeBgColor = formTheme.backgroundColor || `${activeThemeHex}0D`;

  return (
    <div
      className="min-h-screen text-slate-900 flex flex-col font-sans transition-colors duration-300"
      style={{
        backgroundColor: activeBgColor,
        fontFamily: formTheme.textFont ? `${formTheme.textFont}, sans-serif` : undefined,
      }}
    >
      <Navbar
        user={user}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        isLoading={isLoadingData || isLoadingDrive}
        formUrl={currentForm?.responderUri}
        formTitle={currentForm?.info.title}
        onOpenThemeConfig={() => setIsThemeModalOpen(true)}
        onConnectGoogle={handleLogin}
        isTokenMissing={!!user && !token}
        currentView={currentView}
        onSwitchView={setCurrentView}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Toast Notification */}
        {successToast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-start gap-2.5 flex-1">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Aviso del Sistema</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Reconectar</span>
              </button>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 hover:text-rose-800 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentView === 'forms' ? (
          <>
            {/* Form Selector Bar */}
            <FormSelector
              currentForm={currentForm}
              driveForms={driveForms}
              linkedSpreadsheet={linkedSpreadsheet}
              isLoadingDrive={isLoadingDrive}
              onSelectFormId={(id) => loadFormData(id)}
              onOpenDynamicCreateModal={() => setIsDynamicBuilderOpen(true)}
              onOpenAddFieldModal={() => setIsAddFieldModalOpen(true)}
              onOpenDynamicRecordModal={() => setIsDynamicRecordModalOpen(true)}
              onManualIdSubmit={handleManualFormId}
              onOpenThemeConfig={() => setIsThemeModalOpen(true)}
              onDeleteForm={(file) => setFormToDelete(file)}
            />

            {/* Form Header & Themed Display Card (Shows banner, theme color, and fonts) */}
            {currentForm && (
              <ActiveFormDisplayCard
                currentForm={currentForm}
                linkedSpreadsheet={linkedSpreadsheet}
              />
            )}

            {/* Stats Summary Cards */}
            <StatsCards records={records} formTitle={currentForm?.info.title} />

            {/* Quick action banner if no form or no responses yet */}
            {!currentForm ? (
              <div
                className={`rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r ${currentTheme.headerGradient}`}
              >
                <div className="space-y-2 max-w-xl text-center md:text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                    Diseño Dinámico
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold">
                    Crea Formularios de Acuerdo a la Necesidad
                  </h3>
                  <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                    Diseña formularios dinámicos con los campos que requieras (Cédula, Barrio, Tipo de Población, Teléfono, etc.), asegurando siempre Nombre, Correo y Fecha de Registro.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setIsDynamicBuilderOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white text-slate-900 hover:bg-slate-50 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0"
                  >
                    <PlusCircle
                      className="w-4 h-4"
                      style={{ color: currentTheme.primaryHex }}
                    />
                    <span>Crear Formulario Dinámico</span>
                  </button>
                </div>
              </div>
            ) : (
              records.length === 0 && !isLoadingData && (
                <div className="bg-slate-100/70 border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${formTheme.themeColor || currentTheme.primaryHex}20`,
                        color: formTheme.themeColor || currentTheme.primaryHex,
                      }}
                    >
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Formulario Activo: {currentForm.info.title}
                      </h4>
                      <p className="text-xs text-slate-600">
                        Aún no hay respuestas en este formulario. Los ciudadanos pueden diligenciarlo desde el formulario de Google Forms o puedes ver el Excel en línea.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentForm.responderUri && (
                      <a
                        href={currentForm.responderUri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-opacity hover:opacity-95"
                        style={{ backgroundColor: currentTheme.primaryHex }}
                      >
                        <span>Abrir Formulario para Diligenciar</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Main Registrations Table */}
            <RegistrationsTable
              records={records}
              formResponderUrl={currentForm?.responderUri}
              formTitle={currentForm?.info.title}
              formId={currentForm?.formId}
              linkedSpreadsheet={linkedSpreadsheet}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              onOpenDynamicRecordModal={() => setIsDynamicRecordModalOpen(true)}
              isLoading={isLoadingData}
            />
          </>
        ) : currentView === 'guide' ? (
          <ConfigurationGuide />
        ) : currentView === 'reminders' ? (
          <EmailRemindersManager />
        ) : (
          <MeetingScheduler records={records} user={user} />
        )}
      </main>

      {/* Record Detail Modal */}
      <RegistrationDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      {/* Dynamic Form Builder Modal */}
      <DynamicFormBuilderModal
        isOpen={isDynamicBuilderOpen}
        onClose={() => setIsDynamicBuilderOpen(false)}
        onCreateForm={handleCreateDynamicForm}
        isLoading={isOperatingForm}
      />

      {/* Add Field Modal to existing form */}
      <AddFieldModal
        isOpen={isAddFieldModalOpen}
        onClose={() => setIsAddFieldModalOpen(false)}
        formTitle={currentForm?.info.title || 'Formulario'}
        onAddField={handleAddFieldToActiveForm}
        isLoading={isOperatingForm}
      />

      {/* Create Dynamic Record on the spot */}
      <CreateDynamicRecordModal
        isOpen={isDynamicRecordModalOpen}
        onClose={() => setIsDynamicRecordModalOpen(false)}
        currentForm={currentForm}
        onAddLocalRecord={handleAddRecord}
      />

      {/* Theme Configuration Modal */}
      <ThemeConfigModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentForm={currentForm}
        onInsertBannerToGoogleForm={handleInsertBannerToGoogleForm}
      />

      {/* Delete Form Confirmation Dialog */}
      <ConfirmationModal
        isOpen={!!formToDelete}
        title="¿Eliminar formulario de Google Drive?"
        description={`¿Estás seguro de que deseas eliminar "${formToDelete?.name}"? El archivo se moverá a la papelera de tu cuenta de Google Drive.`}
        confirmLabel="Sí, Eliminar Formulario"
        cancelLabel="Cancelar"
        isDestructive={true}
        isLoading={isDeletingForm}
        onConfirm={handleConfirmDeleteForm}
        onCancel={() => setFormToDelete(null)}
        details={
          formToDelete
            ? [
                `Nombre: ${formToDelete.name}`,
                `ID de Formulario: ${formToDelete.id}`,
                'Destino: Papelera de Google Drive (se puede recuperar si fue un error)',
              ]
            : []
        }
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}
