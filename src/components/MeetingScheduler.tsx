import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User } from 'firebase/auth';
import {
  Calendar,
  Clock,
  Mail,
  Video,
  FileText,
  User as UserIcon,
  Copy,
  Check,
  ExternalLink,
  PlusCircle,
  CalendarCheck,
  RefreshCw,
  Edit2,
  Trash2,
  Search,
  Filter,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock4,
  X,
  BookOpen,
  UserCheck,
  UserPlus,
  List,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  listCalendarEvents,
  scheduleMeetingWithDetails,
  updateCalendarMeeting,
  deleteCalendarMeeting,
  CalendarEventItem,
} from '../services/calendarApi';
import {
  listGoogleContacts,
  searchGooglePeopleRealtime,
  GoogleContact,
} from '../services/contactsApi';
import { getAccessToken } from '../services/auth';
import { RegistrationRecord } from '../types/forms';
import { useAppTheme } from '../context/ThemeContext';
import { ConfirmationModal } from './ConfirmationModal';
import { CalendarGrid } from './CalendarGrid';

interface MeetingSchedulerProps {
  records?: RegistrationRecord[];
  user?: User | null;
}

// Consistent vibrant avatar color palette matching Google apps
const AVATAR_COLORS = [
  '#8e24aa', // Purple
  '#e91e63', // Pink
  '#43a047', // Green
  '#1e88e5', // Blue
  '#fb8c00', // Orange
  '#00897b', // Teal
  '#3949ab', // Indigo
  '#00acc1', // Cyan
  '#d81b60', // Rose
  '#7cb342', // Lime
];

const getAvatarColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Helper component to highlight matching substring in name or email (like Gmail)
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <span>{text}</span>;

  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <strong key={i} className="font-extrabold text-slate-900 underline decoration-indigo-400">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const MeetingScheduler = ({ records = [], user }: MeetingSchedulerProps) => {
  const { currentTheme, formTheme, branding } = useAppTheme();
  const themeHex = formTheme.themeColor || currentTheme.primaryHex;
  const themeBg = formTheme.backgroundColor || `${themeHex}0D`;

  // Helper for today's ISO date string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);

  // Calendar Events State
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Google Contacts State
  const [googleContacts, setGoogleContacts] = useState<GoogleContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [realtimeSuggestions, setRealtimeSuggestions] = useState<GoogleContact[]>([]);

  // New Meeting Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [attendeeEmails, setAttendeeEmails] = useState<string[]>([]);
  const [inputEmail, setInputEmail] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmailFilter, setSelectedEmailFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // Most recent first by default
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  // Pagination State for Meetings List
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  const handleViewInCalendar = (event: CalendarEventItem) => {
    setHighlightedEventId(event.id);
    setViewMode('calendar');
  };

  // Edit Meeting State
  const [meetingToEdit, setMeetingToEdit] = useState<CalendarEventItem | null>(null);
  const [editSummary, setEditSummary] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDuration, setEditDuration] = useState<number>(60);
  const [editAttendeeEmails, setEditAttendeeEmails] = useState<string[]>([]);
  const [editInputEmail, setEditInputEmail] = useState('');
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete/Cancel Meeting State
  const [meetingToDelete, setMeetingToDelete] = useState<CalendarEventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / feedback notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Calendar Events
  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setEventsError('Sesión no autorizada para Google Calendar. Por favor haz clic en "Re-autorizar" o conecta tu cuenta de Google.');
        return;
      }
      const fetchedEvents = await listCalendarEvents(token);
      setEvents(fetchedEvents);
    } catch (err: unknown) {
      console.error('Error fetching calendar events:', err);
      const msg = err instanceof Error ? err.message : 'Error al cargar las reuniones de Google Calendar.';
      setEventsError(msg);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Fetch Google Contacts from Address Book and Gmail interactions
  const fetchContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const contacts = await listGoogleContacts(token);
      setGoogleContacts(contacts);
    } catch (err) {
      console.warn('Error fetching Google Contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchContacts();
  }, [fetchEvents, fetchContacts]);

  useEffect(() => {
    try {
      localStorage.setItem('inclusion_social_custom_events_v2', JSON.stringify(events));
    } catch (e) {
      // ignore
    }
  }, [events]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target as Node)) {
        setIsEditDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time search query for the People API when user types
  useEffect(() => {
    const query = inputEmail.trim();
    if (query.length < 2) {
      setRealtimeSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const live = await searchGooglePeopleRealtime(token, query);
          setRealtimeSuggestions(live);
        }
      } catch (e) {
        // Silent catch
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [inputEmail]);

  // Unified list of all contacts: Google Contacts + Directory + Other Contacts + Citizen Records + Calendar Attendees
  const unifiedContactsList = useMemo(() => {
    const map = new Map<string, GoogleContact>();

    // 1. Google Contacts from address book & other contacts
    googleContacts.forEach((gc) => {
      if (gc.email && gc.email.includes('@')) {
        map.set(gc.email.toLowerCase(), gc);
      }
    });

    // 2. Real-time search results
    realtimeSuggestions.forEach((rc) => {
      if (rc.email && rc.email.includes('@')) {
        map.set(rc.email.toLowerCase(), rc);
      }
    });

    // 3. Form Citizen Registrations
    records.forEach((r) => {
      if (r.correo && r.correo.includes('@') && r.correo !== 'No especificado') {
        const key = r.correo.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: `citizen-${r.id}`,
            email: r.correo,
            name: r.nombre || r.correo.split('@')[0],
            source: 'ciudadano',
          });
        }
      }
    });

    // 4. Previous Calendar Attendees
    events.forEach((ev) => {
      ev.attendees?.forEach((att) => {
        if (att.email && att.email.includes('@')) {
          const key = att.email.toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              id: `event-${key}`,
              email: att.email,
              name: att.displayName || att.email.split('@')[0],
              source: 'otros_correos',
            });
          }
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [googleContacts, realtimeSuggestions, records, events]);

  // Filtered Suggestions for the Gmail-style autocomplete dropdown (when typing)
  const filteredSuggestions = useMemo(() => {
    const q = inputEmail.toLowerCase().trim();
    return unifiedContactsList
      .filter((c) => {
        const isAlreadyAdded = attendeeEmails.some((e) => e.toLowerCase() === c.email.toLowerCase());
        if (isAlreadyAdded) return false;
        if (!q) return true;
        return c.email.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      })
      .slice(0, 10); // Show up to 10 matching contacts
  }, [unifiedContactsList, inputEmail, attendeeEmails]);

  // Suggestions for edit form autocomplete
  const editFilteredSuggestions = useMemo(() => {
    const q = editInputEmail.toLowerCase().trim();
    return unifiedContactsList
      .filter((c) => {
        const isAlreadyAdded = editAttendeeEmails.some((e) => e.toLowerCase() === c.email.toLowerCase());
        if (isAlreadyAdded) return false;
        if (!q) return true;
        return c.email.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      })
      .slice(0, 10);
  }, [unifiedContactsList, editInputEmail, editAttendeeEmails]);

  // Add attendee to create form
  const addAttendee = (emailToAdd: string) => {
    const clean = emailToAdd.trim();
    if (!clean || !clean.includes('@')) return;
    if (attendeeEmails.some((e) => e.toLowerCase() === clean.toLowerCase())) {
      setInputEmail('');
      setIsDropdownOpen(false);
      return;
    }
    setAttendeeEmails((prev) => [...prev, clean]);
    setInputEmail('');
    setIsDropdownOpen(false);
  };

  // Remove attendee from create form
  const removeAttendee = (emailToRemove: string) => {
    setAttendeeEmails((prev) => prev.filter((e) => e.toLowerCase() !== emailToRemove.toLowerCase()));
  };

  // Add attendee to edit form
  const addEditAttendee = (emailToAdd: string) => {
    const clean = emailToAdd.trim();
    if (!clean || !clean.includes('@')) return;
    if (editAttendeeEmails.some((e) => e.toLowerCase() === clean.toLowerCase())) {
      setEditInputEmail('');
      setIsEditDropdownOpen(false);
      return;
    }
    setEditAttendeeEmails((prev) => [...prev, clean]);
    setEditInputEmail('');
    setIsEditDropdownOpen(false);
  };

  // Remove attendee from edit form
  const removeEditAttendee = (emailToRemove: string) => {
    setEditAttendeeEmails((prev) => prev.filter((e) => e.toLowerCase() !== emailToRemove.toLowerCase()));
  };

  // Handle key down in email input
  const handleKeyDownEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && inputEmail.trim()) {
        addAttendee(filteredSuggestions[0].email);
      } else if (inputEmail.includes('@')) {
        addAttendee(inputEmail);
      }
    }
  };

  const handleEditKeyDownEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (editFilteredSuggestions.length > 0 && editInputEmail.trim()) {
        addEditAttendee(editFilteredSuggestions[0].email);
      } else if (editInputEmail.includes('@')) {
        addEditAttendee(editInputEmail);
      }
    }
  };

  // Quick action: Add all citizens registered
  const addAllCitizens = () => {
    const citizenEmails = records
      .map((r) => r.correo?.trim())
      .filter((e): e is string => !!e && e.includes('@') && e !== 'No especificado');
    const unique = Array.from(new Set([...attendeeEmails, ...citizenEmails]));
    setAttendeeEmails(unique);
    showNotification(`Se agregaron ${citizenEmails.length} correos de ciudadanos.`);
  };

  // Schedule new meeting
  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No se detectó una sesión activa con Google. Por favor, re-autoriza en la barra superior.');
      }

      const finalAttendees = [...attendeeEmails];
      if (inputEmail.trim() && inputEmail.includes('@') && !finalAttendees.includes(inputEmail.trim())) {
        finalAttendees.push(inputEmail.trim());
      }

      if (finalAttendees.length === 0) {
        throw new Error('Debes agregar al menos un correo de invitado para enviar la reunión.');
      }

      if (!date || !time) {
        throw new Error('Por favor, especifica la fecha y hora de la reunión.');
      }

      const startDateTime = new Date(`${date}T${time}:00`);
      if (isNaN(startDateTime.getTime())) {
        throw new Error('La fecha u hora seleccionada no es válida.');
      }

      const createdEvent = await scheduleMeetingWithDetails(
        token,
        finalAttendees.join(', '),
        summary.trim() || 'Reunión Institucional',
        description.trim(),
        startDateTime,
        durationMinutes
      );

      setEvents((prev) => [createdEvent, ...prev]);
      showNotification(`¡Reunión programada! Invitaciones enviadas a ${finalAttendees.length} participantes.`);

      setSummary('');
      setDescription('');
      setAttendeeEmails([]);
      setInputEmail('');
      setIsFormOpen(false);
    } catch (err: unknown) {
      console.error('Error al programar reunión:', err);
      const errMsg = err instanceof Error ? err.message : 'Error inesperado al programar la reunión.';
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (event: CalendarEventItem) => {
    setMeetingToEdit(event);
    setEditSummary(event.summary || '');
    setEditDescription(event.description || '');

    const startStr = event.start.dateTime || event.start.date || '';
    if (startStr) {
      const startDate = new Date(startStr);
      if (!isNaN(startDate.getTime())) {
        setEditDate(startDate.toISOString().slice(0, 10));
        const hours = String(startDate.getHours()).padStart(2, '0');
        const mins = String(startDate.getMinutes()).padStart(2, '0');
        setEditTime(`${hours}:${mins}`);

        const endStr = event.end.dateTime || event.end.date || '';
        if (endStr) {
          const endDate = new Date(endStr);
          if (!isNaN(endDate.getTime())) {
            const diffMin = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
            setEditDuration(diffMin > 0 ? diffMin : 60);
          }
        }
      }
    } else {
      setEditDate(todayStr);
      setEditTime('10:00');
      setEditDuration(60);
    }

    const currentEmails = event.attendees?.map((a) => a.email).filter(Boolean) || [];
    setEditAttendeeEmails(currentEmails);
    setEditInputEmail('');
    setEditError(null);
  };

  // Save Edit Meeting
  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingToEdit) return;

    setIsUpdating(true);
    setEditError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Sesión no autorizada para Google Calendar.');
      }

      const finalAttendees = [...editAttendeeEmails];
      if (editInputEmail.trim() && editInputEmail.includes('@') && !finalAttendees.includes(editInputEmail.trim())) {
        finalAttendees.push(editInputEmail.trim());
      }

      if (finalAttendees.length === 0) {
        throw new Error('Debes mantener al menos un correo de invitado.');
      }

      const startDateTime = new Date(`${editDate}T${editTime}:00`);
      if (isNaN(startDateTime.getTime())) {
        throw new Error('La fecha u hora seleccionada no es válida.');
      }

      const updated = await updateCalendarMeeting(token, meetingToEdit.id, {
        summary: editSummary,
        description: editDescription,
        startTime: startDateTime,
        durationMinutes: editDuration,
        attendeeEmail: finalAttendees.join(', '),
      });

      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      showNotification(`Reunión "${updated.summary}" actualizada. Invitados notificados.`);
      setMeetingToEdit(null);
    } catch (err: unknown) {
      console.error('Error al actualizar reunión:', err);
      const errMsg = err instanceof Error ? err.message : 'Error al actualizar la reunión.';
      setEditError(errMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delete / Cancel Meeting
  const handleConfirmDelete = async () => {
    if (!meetingToDelete) return;

    setIsDeleting(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Sesión no autorizada para Google Calendar.');
      }

      await deleteCalendarMeeting(token, meetingToDelete.id);

      setEvents((prev) => prev.filter((ev) => ev.id !== meetingToDelete.id));
      showNotification(`La reunión "${meetingToDelete.summary}" fue cancelada y se notificó a los invitados.`);
      setMeetingToDelete(null);
    } catch (err: unknown) {
      console.error('Error al cancelar reunión:', err);
      const errMsg = err instanceof Error ? err.message : 'Error al cancelar la reunión en Google Calendar.';
      showNotification(errMsg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy Meet Link
  const copyMeetLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const summaryLower = (ev.summary || '').toLowerCase();
      if (summaryLower.includes('cumpleaños') || summaryLower.includes('birthday')) {
        return false;
      }

      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (ev.summary && ev.summary.toLowerCase().includes(q)) ||
        (ev.description && ev.description.toLowerCase().includes(q)) ||
        ev.attendees?.some(
          (a) =>
            a.email.toLowerCase().includes(q) ||
            (a.displayName && a.displayName.toLowerCase().includes(q))
        );

      if (!matchSearch) return false;

      if (selectedEmailFilter !== 'all') {
        const filterLower = selectedEmailFilter.toLowerCase();
        const hasAttendee = ev.attendees?.some((a) => a.email.toLowerCase() === filterLower);
        const isOrganizer = ev.organizer?.email?.toLowerCase() === filterLower;
        const isCreator = ev.creator?.email?.toLowerCase() === filterLower;
        if (!hasAttendee && !isOrganizer && !isCreator) return false;
      }

      return true;
    });
  }, [events, searchTerm, selectedEmailFilter]);

  // "en la lista de reuniones que muestre primero los mas recientes"
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const timeA = new Date(a.start.dateTime || a.start.date || '').getTime() || 0;
      const timeB = new Date(b.start.dateTime || b.start.date || '').getTime() || 0;
      // Most recent first when sortOrder is 'desc'
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [filteredEvents, sortOrder]);

  // Reset page when search, filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEmailFilter, sortOrder, itemsPerPage]);

  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage) || 1;

  // Paginated Events for List View
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedEvents, currentPage, itemsPerPage]);

  // Format date helper
  const formatEventDate = (dateTimeStr?: string, dateStr?: string) => {
    const raw = dateTimeStr || dateStr;
    if (!raw) return 'Fecha no especificada';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString('es-CO', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: dateTimeStr ? '2-digit' : undefined,
      minute: dateTimeStr ? '2-digit' : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all animate-in fade-in slide-in-from-bottom-4 ${
            notification.type === 'success'
              ? 'bg-emerald-800 text-white border border-emerald-700'
              : 'bg-rose-800 text-white border border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Module Header Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6 transition-colors"
        style={{ backgroundColor: themeHex }}
      >
        <div className="space-y-2 max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs">
            <Video className="w-3.5 h-3.5" />
            <span>Google Meet & Calendar · Autocompletado estilo Gmail</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Programa Audiencias y Reuniones Multi-Usuario
          </h2>
          <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
            Escribe nombres o correos para autocompletar sugerencias desde tu correo y directorio (igual que en Gmail) y convoca a múltiples personas con enlace de Google Meet.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 justify-center md:justify-start">
            {user?.email && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-black/20 border border-white/20">
                <Mail className="w-3.5 h-3.5 text-white/80" />
                <span>Cuenta: <strong className="text-white">{user.email}</strong></span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-white/15 border border-white/20">
              <BookOpen className="w-3.5 h-3.5 text-white/90" />
              <span>{unifiedContactsList.length} contactos de correo sincronizados</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              fetchEvents();
              fetchContacts();
            }}
            disabled={isLoadingEvents || isLoadingContacts}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all cursor-pointer disabled:opacity-50"
            title="Sincronizar reuniones y contactos desde Google"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents || isLoadingContacts ? 'animate-spin' : ''}`} />
            <span>Sincronizar Contactos</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-50 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Nueva Reunión</span>
          </button>
        </div>
      </div>

      {/* New Meeting Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div
            className="rounded-3xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
            style={{
              backgroundColor: '#ffffff',
              borderColor: `${themeHex}30`,
            }}
          >
            {/* Modal Header */}
            <div
              className="shrink-0 p-5 sm:p-6 border-b flex items-center justify-between"
              style={{
                backgroundColor: `${themeHex}08`,
                borderBottomColor: `${themeHex}20`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: themeHex }}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Agendar Nueva Cita Multi-Usuario (Google Meet)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Autocompleta los invitados con la misma libreta y sugerencias que aparecen en tu correo de Gmail.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSchedule} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {formError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{formError}</p>
                  </div>
                )}

                {/* Multi-Attendee Tag Input with Exact Gmail Autocomplete Popover */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Para: Invitados de la Reunión ({attendeeEmails.length}) <span className="text-rose-500">*</span>
                    </label>

                    {records.length > 0 && (
                      <button
                        type="button"
                        onClick={addAllCitizens}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Agregar ciudadanos del formulario ({records.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Chips + Input container with max-h-36 overflow */}
                  <div className="relative" ref={dropdownRef}>
                    <div className="min-h-[46px] max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white focus-within:border-indigo-400 transition-all">
                      <span className="text-xs font-bold text-slate-400 pl-1 select-none">Para:</span>

                  {/* Added attendee chips */}
                  {attendeeEmails.map((em) => {
                    const matched = unifiedContactsList.find((c) => c.email.toLowerCase() === em.toLowerCase());
                    const displayName = matched?.name || em;
                    const color = getAvatarColor(displayName);

                    return (
                      <span
                        key={em}
                        className="inline-flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs hover:border-slate-300 transition-all group"
                      >
                        {matched?.photoUrl ? (
                          <img
                            src={matched.photoUrl}
                            alt={displayName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="max-w-[200px] truncate">{displayName}</span>
                        <button
                          type="button"
                          onClick={() => removeAttendee(em)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}

                  {/* Input field */}
                  <input
                    type="text"
                    value={inputEmail}
                    onChange={(e) => {
                      setInputEmail(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleKeyDownEmail}
                    placeholder={
                      attendeeEmails.length === 0
                        ? 'Escribe nombre o correo...'
                        : 'Escribe otro invitado...'
                    }
                    className="flex-1 min-w-[200px] bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none py-1.5 px-2"
                  />
                </div>

                {/* EXACT GMAIL-STYLE AUTOCOMPLETE DROPDOWN */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 bg-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Sugerencias de Contactos de Correo</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {filteredSuggestions.length} coincidentes
                      </span>
                    </div>

                    {filteredSuggestions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        {inputEmail.includes('@') ? (
                          <button
                            type="button"
                            onClick={() => addAttendee(inputEmail)}
                            className="font-semibold text-indigo-600 hover:underline"
                          >
                            Presiona Enter para invitar a: &ldquo;{inputEmail}&rdquo;
                          </button>
                        ) : (
                          <span>No se encontraron coincidencias para &ldquo;{inputEmail}&rdquo;</span>
                        )}
                      </div>
                    ) : (
                      filteredSuggestions.map((contact) => {
                        const avatarBg = getAvatarColor(contact.name || contact.email);
                        const initial = (contact.name || contact.email).charAt(0).toUpperCase();

                        return (
                          <button
                            key={contact.email}
                            type="button"
                            onClick={() => addAttendee(contact.email)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-100/80 flex items-center gap-3.5 transition-colors cursor-pointer group"
                          >
                            {/* Circular Avatar */}
                            {contact.photoUrl ? (
                              <img
                                src={contact.photoUrl}
                                alt={contact.name}
                                className="w-10 h-10 rounded-full object-cover shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs"
                                style={{ backgroundColor: avatarBg }}
                              >
                                {initial}
                              </div>
                            )}

                            {/* Contact Details with Matching Substring Highlighted */}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 truncate leading-tight group-hover:text-indigo-950">
                                <HighlightedText text={contact.name} highlight={inputEmail} />
                              </p>
                              <p className="text-xs text-slate-500 truncate leading-normal pt-0.5">
                                <HighlightedText text={contact.email} highlight={inputEmail} />
                              </p>
                            </div>

                            {/* Source badge */}
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                              {contact.source === 'directorio'
                                ? 'Directorio'
                                : contact.source === 'ciudadano'
                                ? 'Ciudadano'
                                : 'Correo'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                <span>Escribe cualquier letra para buscar en el correo, presiona <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-600">Enter</kbd> o haz clic sobre la persona para agregarla.</span>
              </p>
            </div>

            {/* Meeting Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Título o Asunto de la Reunión <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Ej: Audiencia de seguimiento ciudadano o mesa de trabajo"
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white"
              />
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fecha <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full pl-9.5 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hora de Inicio <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full pl-9.5 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Duración Estimada
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      durationMinutes === mins
                        ? 'text-white border-transparent shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    style={{
                      backgroundColor: durationMinutes === mins ? currentTheme.primaryHex : undefined,
                    }}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Agenda u Observaciones
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detalla los puntos a tratar en la reunión..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white resize-none"
              />
            </div>

              </div>

              {/* Sticky Modal Footer */}
              <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-6 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  style={{ backgroundColor: currentTheme.primaryHex }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Agendando reunión...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      <span>Agendar para {attendeeEmails.length} Invitado(s)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Emails Explorer Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Libreta de Contactos y Correos de la Cuenta ({unifiedContactsList.length})
                </h3>
                {isLoadingContacts && (
                  <span className="text-[10px] text-indigo-600 animate-pulse font-semibold">
                    (Sincronizando libreta...)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Contactos de Google Contacts, directorio y participantes de reuniones.
              </p>
            </div>
          </div>

          {selectedEmailFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedEmailFilter('all')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtro de correo</span>
            </button>
          )}
        </div>

        {/* Horizontal scroll of emails */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedEmailFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedEmailFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({events.length})
          </button>
          {unifiedContactsList.map((item) => {
            const isSelected = selectedEmailFilter.toLowerCase() === item.email.toLowerCase();
            return (
              <button
                key={item.email}
                type="button"
                onClick={() => setSelectedEmailFilter(item.email)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'text-white font-bold shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
                style={{
                  backgroundColor: isSelected ? currentTheme.primaryHex : undefined,
                }}
              >
                <Mail className="w-3 h-3 opacity-70" />
                <span>{item.name ? `${item.name}` : item.email}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.email.split('@')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Switcher Bar (Calendario Interactivo vs Lista de Reuniones) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Calendario Interactivo</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4 text-indigo-600" />
            <span>Lista de Reuniones ({filteredEvents.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search across meetings */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, descripción o invitado..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white"
            />
          </div>

          <span className="hidden md:inline text-xs text-slate-500 font-medium">
            <strong className="text-slate-800">{filteredEvents.length}</strong> eventos
          </span>
        </div>
      </div>

      {/* Main Content: Either Interactive Calendar Grid or Detailed List */}
      {viewMode === 'calendar' ? (
        <CalendarGrid
          events={filteredEvents}
          onSelectEvent={(ev) => setHighlightedEventId(ev.id)}
          onEditEvent={openEditModal}
          onDeleteEvent={(ev) => setMeetingToDelete(ev)}
          onNewMeetingOnDate={(dateStr) => {
            setDate(dateStr);
            setIsFormOpen(true);
          }}
          highlightedEventId={highlightedEventId}
        />
      ) : (
        <div
          className="rounded-3xl border shadow-2xs overflow-hidden transition-all backdrop-blur-xs"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: `${themeHex}30`,
          }}
        >
          {/* Meetings List Card */}
          <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Mostrando <strong className="text-slate-800">{paginatedEvents.length}</strong> de <strong className="text-slate-800">{filteredEvents.length}</strong> reuniones (Página {currentPage} de {totalPages})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  title="Cambiar orden de las reuniones"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>{sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguas primero'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Events Content */}
          {isLoadingEvents ? (
            <div className="py-16 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div
                  className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: currentTheme.primaryHex, borderTopColor: 'transparent' }}
                />
                <p className="text-xs font-semibold text-slate-600">
                  Sincronizando reuniones desde Google Calendar...
                </p>
              </div>
            </div>
          ) : eventsError ? (
            <div className="p-8 text-center max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 mb-1">No se pudieron cargar las reuniones</h4>
              <p className="text-xs text-slate-500 mb-4">{eventsError}</p>
              <button
                type="button"
                onClick={fetchEvents}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="max-w-md mx-auto flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: `${currentTheme.primaryHex}15`,
                    color: currentTheme.primaryHex,
                  }}
                >
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  {searchTerm || selectedEmailFilter !== 'all'
                    ? 'No se encontraron reuniones con los filtros aplicados'
                    : 'Aún no hay reuniones programadas en Google Calendar'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {searchTerm || selectedEmailFilter !== 'all'
                    ? 'Intenta restablecer la búsqueda o el filtro de correos.'
                    : 'Haz clic en "Nueva Reunión" para agendar una cita multi-usuario con Google Meet.'}
                </p>
                {!isFormOpen && (
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                    className="mt-4 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity hover:opacity-95 cursor-pointer"
                    style={{ backgroundColor: currentTheme.primaryHex }}
                  >
                    Programar Primera Reunión
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginatedEvents.map((event) => {
                const startDisplay = formatEventDate(event.start.dateTime, event.start.date);
                const meetLink = event.hangoutLink;
                const hasAttendees = event.attendees && event.attendees.length > 0;

                return (
                  <div
                    key={event.id}
                    className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                  >
                    {/* Left: Meeting Info */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-slate-900 leading-snug break-words">
                          {event.summary || '(Sin título)'}
                        </h4>
                        {event.status === 'confirmed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Check className="w-3 h-3" /> Confirmada
                          </span>
                        )}
                        {event.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <XCircle className="w-3 h-3" /> Cancelada
                          </span>
                        )}
                      </div>

                      {/* Date and Time badge */}
                      <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{startDisplay}</span>
                        </span>

                        {event.organizer?.email && (
                          <span className="text-slate-500 truncate max-w-[260px]">
                            Organizador: <strong className="text-slate-700">{event.organizer.email}</strong>
                          </span>
                        )}
                      </div>

                      {/* Attendees multi-list with avatar circles */}
                      {hasAttendees && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Invitados ({event.attendees!.length}):</span>
                          </span>
                          {event.attendees!.map((att) => {
                            const contactMatch = unifiedContactsList.find((c) => c.email.toLowerCase() === att.email.toLowerCase());
                            const displayName = contactMatch?.name || att.displayName || att.email;
                            const color = getAvatarColor(displayName);

                            return (
                              <span
                                key={att.email}
                                className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200"
                                title={`Estado: ${att.responseStatus || 'Pendiente'}`}
                              >
                                <div
                                  className="w-4 h-4 rounded-full text-white font-bold text-[9px] flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: color }}
                                >
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate max-w-[180px]">{displayName !== att.email ? `${displayName} (${att.email})` : att.email}</span>
                                {att.responseStatus === 'accepted' && (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Description preview */}
                      {event.description && (
                        <p className="text-xs text-slate-500 line-clamp-3 pt-0.5 break-words whitespace-pre-wrap">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end pt-2 lg:pt-0">
                      {/* Ver en Calendario Integrado (Stays inside app, does not redirect) */}
                      <button
                        type="button"
                        onClick={() => handleViewInCalendar(event)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        title="Visualizar en el calendario interactivo integrado de la plataforma"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ver en Calendario</span>
                      </button>

                      {/* Meet Link */}
                      {meetLink ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Google Meet</span>
                            <ExternalLink className="w-3 h-3 opacity-80" />
                          </a>

                          <button
                            type="button"
                            onClick={() => copyMeetLink(meetLink)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                            title="Copiar enlace de Google Meet"
                          >
                            {copiedLink === meetLink ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : null}

                      {/* Subtle external link icon if user desires external Google Calendar tab */}
                      {event.htmlLink && (
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                          title="Abrir en Google Calendar externo"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openEditModal(event)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        title="Modificar fecha, hora, título o invitados de la reunión"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Editar</span>
                      </button>

                      {/* Delete/Cancel Button */}
                      <button
                        type="button"
                        onClick={() => setMeetingToDelete(event)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        title="Cancelar la reunión y notificar a los invitados"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredEvents.length > 0 && (
            <div className="p-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Resultados por página:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  Anterior
                </button>
                <span className="text-xs font-medium text-slate-700 px-2">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Meeting Modal */}
      {meetingToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: currentTheme.primaryHex }}
                >
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Editar Reunión en Google Calendar</h3>
                  <p className="text-xs text-slate-500">Se actualizará en Calendar y se notificará a los invitados.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMeetingToEdit(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleUpdateMeeting} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {editError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{editError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Título de la Reunión
                  </label>
                  <input
                    type="text"
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:bg-white"
                  />
                </div>

                {/* Edit Multi-Attendee Chips with max-h-36 overflow-y-auto */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Invitados ({editAttendeeEmails.length})
                  </label>
                  <div className="relative" ref={editDropdownRef}>
                    <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-1.5">
                      {editAttendeeEmails.map((em) => {
                        const matched = unifiedContactsList.find((c) => c.email.toLowerCase() === em.toLowerCase());
                        const displayName = matched?.name || em;
                        const color = getAvatarColor(displayName);

                        return (
                          <span
                            key={em}
                            className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full text-xs bg-white border border-slate-200 text-slate-800 shadow-2xs"
                          >
                            <div
                              className="w-4 h-4 rounded-full text-white font-bold text-[9px] flex items-center justify-center shrink-0"
                              style={{ backgroundColor: color }}
                            >
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="max-w-[180px] truncate">{displayName}</span>
                            <button
                              type="button"
                              onClick={() => removeEditAttendee(em)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}

                      <input
                        type="text"
                        value={editInputEmail}
                        onChange={(e) => {
                          setEditInputEmail(e.target.value);
                          setIsEditDropdownOpen(true);
                        }}
                        onFocus={() => setIsEditDropdownOpen(true)}
                        onKeyDown={handleEditKeyDownEmail}
                        placeholder="Escribe para buscar o agregar otro..."
                        className="flex-1 min-w-[180px] bg-transparent text-xs text-slate-900 focus:outline-none py-1 px-1"
                      />
                    </div>

                    {/* Edit Autocomplete Dropdown */}
                    {isEditDropdownOpen && editFilteredSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                        {editFilteredSuggestions.map((contact) => {
                          const avatarBg = getAvatarColor(contact.name || contact.email);
                          const initial = (contact.name || contact.email).charAt(0).toUpperCase();

                          return (
                            <button
                              key={contact.email}
                              type="button"
                              onClick={() => addEditAttendee(contact.email)}
                              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-xs transition-colors"
                            >
                              <div
                                className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0"
                                style={{ backgroundColor: avatarBg }}
                              >
                                {initial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-800 truncate">
                                  <HighlightedText text={contact.name} highlight={editInputEmail} />
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  <HighlightedText text={contact.email} highlight={editInputEmail} />
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Hora de Inicio
                    </label>
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Duración Estimada
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setEditDuration(mins)}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          editDuration === mins
                            ? 'text-white border-transparent shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        style={{
                          backgroundColor: editDuration === mins ? currentTheme.primaryHex : undefined,
                        }}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Descripción / Agenda
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMeetingToEdit(null)}
                  disabled={isUpdating}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: currentTheme.primaryHex }}
                >
                  {isUpdating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Cancel/Delete */}
      <ConfirmationModal
        isOpen={!!meetingToDelete}
        title="¿Cancelar y eliminar esta reunión?"
        description={`Se cancelará permanentemente la reunión "${meetingToDelete?.summary}" de tu Google Calendar y se enviará una notificación automática de cancelación por correo a todos los invitados.`}
        confirmLabel="Sí, Cancelar Reunión"
        cancelLabel="Volver"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setMeetingToDelete(null)}
        details={[
          `Reunión: ${meetingToDelete?.summary || 'Sin título'}`,
          `Fecha: ${formatEventDate(meetingToDelete?.start.dateTime, meetingToDelete?.start.date)}`,
          `Invitados: ${
            meetingToDelete?.attendees && meetingToDelete.attendees.length > 0
              ? meetingToDelete.attendees.map((a) => a.email).join(', ')
              : 'Sin invitados externos'
          }`,
        ]}
      />
    </div>
  );
};
