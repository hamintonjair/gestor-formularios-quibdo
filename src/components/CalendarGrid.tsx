import { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Video,
  Users,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  Plus,
  Mail,
  X,
} from 'lucide-react';
import { CalendarEventItem } from '../services/calendarApi';
import { useAppTheme } from '../context/ThemeContext';

interface CalendarGridProps {
  events: CalendarEventItem[];
  onSelectEvent?: (event: CalendarEventItem) => void;
  onEditEvent: (event: CalendarEventItem) => void;
  onDeleteEvent: (event: CalendarEventItem) => void;
  onNewMeetingOnDate?: (dateStr: string) => void;
  highlightedEventId?: string | null;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const CalendarGrid = ({
  events,
  onSelectEvent,
  onEditEvent,
  onDeleteEvent,
  onNewMeetingOnDate,
  highlightedEventId,
}: CalendarGridProps) => {
  const { currentTheme, formTheme } = useAppTheme();
  const themeHex = formTheme.themeColor || currentTheme.primaryHex;

  // Current view date (month/year)
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => {
    if (highlightedEventId) {
      const match = events.find((e) => e.id === highlightedEventId);
      const raw = match?.start.dateTime || match?.start.date;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return new Date();
  });

  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(() => {
    if (highlightedEventId) {
      return events.find((e) => e.id === highlightedEventId) || null;
    }
    return null;
  });

  // Track the explicitly selected calendar day (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (highlightedEventId) {
      const match = events.find((e) => e.id === highlightedEventId);
      const raw = match?.start.dateTime || match?.start.date;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      }
    }
    return new Date().toISOString().slice(0, 10);
  });

  // Sync selected event, date, and month when highlightedEventId changes
  useEffect(() => {
    if (highlightedEventId) {
      const match = events.find((e) => e.id === highlightedEventId);
      if (match) {
        setSelectedEvent(match);
        const raw = match.start.dateTime || match.start.date;
        if (raw) {
          const d = new Date(raw);
          if (!isNaN(d.getTime())) {
            setCurrentViewDate(d);
            setSelectedDate(d.toISOString().slice(0, 10));
          }
        }
      }
    }
  }, [highlightedEventId, events]);

  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentViewDate(today);
    const todayKey = today.toISOString().slice(0, 10);
    setSelectedDate(todayKey);
  };

  // Helper to extract YYYY-MM-DD from an event
  const getEventDateKey = (event: CalendarEventItem): string => {
    const raw = event.start.dateTime || event.start.date || '';
    if (!raw) return '';
    if (raw.length >= 10 && raw.charAt(4) === '-' && raw.charAt(7) === '-') {
      return raw.slice(0, 10);
    }
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  // Human-readable Spanish date formatter
  const formatReadableDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime())) return dateStr;
    return dt.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Map events by date YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const ev of events) {
      const dateKey = getEventDateKey(ev);
      if (dateKey) {
        const existing = map.get(dateKey) || [];
        existing.push(ev);
        map.set(dateKey, existing);
      }
    }
    return map;
  }, [events]);

  // Calendar days grid calculation (Monday through Sunday)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const totalDaysInMonth = lastDayOfMonth.getDate();

    // 0 is Sunday, 1 is Monday ... 6 is Saturday. Convert to Monday=0 .. Sunday=6
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = prevDate.toISOString().slice(0, 10);
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const dateObj = new Date(year, month, dayNum);
      // Format as YYYY-MM-DD local
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dayNum).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill a complete 35 or 42 grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().slice(0, 10);
      cells.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [year, month]);

  const copyMeetLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const formatEventTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return '';
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Calendar Header Navigation */}
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-3xl border shadow-2xs backdrop-blur-xs transition-colors"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: `${themeHex}30`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs"
            style={{ backgroundColor: themeHex }}
          >
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {MONTH_NAMES[month]} {year}
            </h3>
            <p className="text-xs text-slate-500">
              Calendario interactivo integrado con Google Calendar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleGoToday}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Hoy
          </button>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Calendar Grid */}
        <div
          className="lg:col-span-2 rounded-3xl border shadow-2xs overflow-hidden backdrop-blur-xs transition-colors"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: `${themeHex}30`,
          }}
        >
          {/* Weekday Labels */}
          <div
            className="grid grid-cols-7 border-b text-center py-2.5 text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${themeHex}08`,
              borderColor: `${themeHex}20`,
              color: themeHex,
            }}
          >
            {WEEKDAY_NAMES.map((name) => (
              <div key={name}>{name}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {calendarCells.map((cell) => {
              const dayEvents = eventsByDate.get(cell.dateStr) || [];
              const isSelectedDay = selectedDate === cell.dateStr;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                    if (dayEvents.length > 0) {
                      setSelectedEvent(dayEvents[0]);
                      if (onSelectEvent) onSelectEvent(dayEvents[0]);
                    } else {
                      setSelectedEvent(null);
                    }
                  }}
                  className={`min-h-[96px] sm:min-h-[110px] p-1.5 sm:p-2 transition-all flex flex-col justify-between group cursor-pointer relative ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/40 text-slate-300'
                      : isSelectedDay
                      ? 'shadow-xs z-10'
                      : 'hover:bg-slate-50/70 bg-white/70'
                  }`}
                  style={
                    isSelectedDay
                      ? {
                          backgroundColor: `${themeHex}12`,
                          outline: `2px solid ${themeHex}`,
                          outlineOffset: '-2px',
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          cell.isToday
                            ? 'bg-rose-500 text-white shadow-2xs font-extrabold ring-2 ring-rose-200'
                            : isSelectedDay
                            ? 'text-white shadow-2xs font-extrabold'
                            : cell.isCurrentMonth
                            ? 'text-slate-700'
                            : 'text-slate-300'
                        }`}
                        style={
                          isSelectedDay && !cell.isToday
                            ? { backgroundColor: themeHex }
                            : undefined
                        }
                      >
                        {cell.dayNum}
                      </span>
                      {isSelectedDay && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-tight hidden xl:inline"
                          style={{ color: themeHex }}
                        >
                          Seleccionado
                        </span>
                      )}
                    </div>

                    {cell.isCurrentMonth && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(cell.dateStr);
                          if (onNewMeetingOnDate) onNewMeetingOnDate(cell.dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-600 hover:bg-slate-100 p-1 rounded-lg"
                        title="Programar reunión en este día"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Day Events Pills */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const isHighlighted =
                        selectedEvent?.id === ev.id || highlightedEventId === ev.id;
                      const timeStr = formatEventTime(ev.start.dateTime);

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(cell.dateStr);
                            setSelectedEvent(ev);
                            if (onSelectEvent) onSelectEvent(ev);
                          }}
                          className={`px-1.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold truncate flex items-center gap-1 border transition-all cursor-pointer ${
                            isHighlighted
                              ? 'text-white shadow-2xs'
                              : ev.hangoutLink
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'hover:opacity-90'
                          }`}
                          style={
                            isHighlighted
                              ? { backgroundColor: themeHex, borderColor: themeHex }
                              : !ev.hangoutLink
                              ? {
                                  backgroundColor: `${themeHex}18`,
                                  color: themeHex,
                                  borderColor: `${themeHex}35`,
                                }
                              : undefined
                          }
                        >
                          {ev.hangoutLink ? (
                            <Video className="w-2.5 h-2.5 shrink-0" />
                          ) : (
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                          )}
                          <span className="shrink-0">{timeStr}</span>
                          <span className="truncate">{ev.summary || 'Reunión'}</span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <div className="text-[10px] font-bold text-slate-500 px-1 pt-0.5">
                        +{dayEvents.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Event Details Panel */}
        <div className="space-y-4">
          <div
            className="rounded-3xl border shadow-2xs p-6 space-y-4 backdrop-blur-xs transition-colors"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              borderColor: `${themeHex}30`,
            }}
          >
            {/* Header: Selected Date */}
            <div className="pb-3 border-b border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" style={{ color: themeHex }} />
                  <span>Día Seleccionado</span>
                </h4>
                {onNewMeetingOnDate && (
                  <button
                    type="button"
                    onClick={() => onNewMeetingOnDate(selectedDate)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                    style={{
                      backgroundColor: `${themeHex}15`,
                      color: themeHex,
                    }}
                    title="Agendar nueva reunión en esta fecha"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Cita</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 capitalize">
                {formatReadableDate(selectedDate)}
              </p>

              {/* Multiple Events Selector on this Date */}
              {(() => {
                const dayEvs = eventsByDate.get(selectedDate) || [];
                if (dayEvs.length <= 1) return null;
                return (
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5">
                    {dayEvs.map((ev, idx) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setSelectedEvent(ev)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          selectedEvent?.id === ev.id
                            ? 'text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        style={{
                          backgroundColor: selectedEvent?.id === ev.id ? themeHex : undefined,
                        }}
                      >
                        {formatEventTime(ev.start.dateTime) || `Cita ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {selectedEvent ? (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {selectedEvent.summary || '(Sin título)'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {formatEventTime(selectedEvent.start.dateTime) || 'Día completo'}
                        {selectedEvent.end.dateTime && ` - ${formatEventTime(selectedEvent.end.dateTime)}`}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {getEventDateKey(selectedEvent)}
                    </span>
                  </div>
                </div>

                {/* Google Meet Action Box */}
                {selectedEvent.hangoutLink && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <Video className="w-4 h-4 text-emerald-600" />
                      <span>Google Meet Integrado</span>
                    </div>

                    <a
                      href={selectedEvent.hangoutLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-emerald-900 hover:underline break-all block"
                    >
                      {selectedEvent.hangoutLink}
                    </a>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={selectedEvent.hangoutLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Entrar a Google Meet</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>

                      <button
                        type="button"
                        onClick={() => copyMeetLink(selectedEvent.hangoutLink!)}
                        className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                        title="Copiar enlace de Google Meet"
                      >
                        {copiedLink === selectedEvent.hangoutLink ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedEvent.description && (
                  <div
                    className="p-3.5 rounded-2xl border text-xs text-slate-700 space-y-1.5 overflow-hidden"
                    style={{
                      backgroundColor: `${themeHex}0A`,
                      borderColor: `${themeHex}25`,
                    }}
                  >
                    <span
                      className="font-bold block uppercase text-[10px] tracking-wider"
                      style={{ color: themeHex }}
                    >
                      Descripción / Agenda:
                    </span>
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] leading-relaxed max-h-52 overflow-y-auto pr-1">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Attendees list */}
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Invitados ({selectedEvent.attendees.length}):
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {selectedEvent.attendees.map((att) => (
                        <div
                          key={att.email}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                        >
                          <div className="min-w-0 flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800 truncate">
                              {att.displayName || att.email}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ${
                              att.responseStatus === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : att.responseStatus === 'declined'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {att.responseStatus === 'accepted'
                              ? 'Aceptó'
                              : att.responseStatus === 'declined'
                              ? 'Rechazó'
                              : 'Pendiente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onEditEvent(selectedEvent)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteEvent(selectedEvent)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs space-y-4 animate-in fade-in duration-100">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                  style={{
                    backgroundColor: `${themeHex}18`,
                    color: themeHex,
                  }}
                >
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-0.5">
                    Sin reuniones en este día
                  </h4>
                  <p className="text-xs text-slate-500">
                    No tienes reuniones agendadas para el {formatReadableDate(selectedDate)}.
                  </p>
                </div>
                {onNewMeetingOnDate && (
                  <button
                    type="button"
                    onClick={() => onNewMeetingOnDate(selectedDate)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-white font-bold rounded-xl text-xs shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
                    style={{ backgroundColor: themeHex }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agendar Cita en este Día</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
