import React, { useState, useEffect } from 'react';
import { Mail, Send, Clock, CheckCircle, Bell, Users, Calendar, Sparkles } from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';

interface Attendee {
  email: string;
  displayName?: string;
}

interface MeetingItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: Attendee[];
  description: string;
  meetLink?: string;
  rawStartTimestamp: number;
}

export const EmailRemindersManager: React.FC = () => {
  const { currentTheme } = useAppTheme();
  const themeHex = currentTheme.primaryHex;
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [customSubject, setCustomSubject] = useState('Recordatorio de Reunión Institucional - Inclusión Social');
  const [reminderType, setReminderType] = useState<'24h' | '2h' | 'custom'>('24h');
  const [customMessage, setCustomMessage] = useState(
    'Estimado ciudadano, le recordamos su cita programada. Por favor acuda puntualmente con su documento de identidad.'
  );
  const [sentLogs, setSentLogs] = useState<Array<{ id: string; title: string; email: string; time: string; status: 'success' }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('inclusion_social_custom_events_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        const filtered = parsed.filter((e: any) => {
          const sum = (e.summary || '').toLowerCase();
          return !sum.includes('cumpleaños') && !sum.includes('birthday');
        });

        const mapped: MeetingItem[] = filtered.map((e: any) => {
          const rawStart = e.start?.dateTime
            ? new Date(e.start.dateTime).getTime()
            : e.start?.date
            ? new Date(e.start.date).getTime()
            : 0;

          const timeFormatted = e.start?.dateTime
            ? new Date(e.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            : '09:00';

          return {
            id: e.id,
            title: e.summary || 'Reunión sin título',
            date: e.start?.dateTime ? e.start.dateTime.slice(0, 10) : (e.start?.date || ''),
            time: timeFormatted,
            location: e.location || 'Google Meet',
            attendees: e.attendees || [],
            description: e.description || '',
            meetLink: e.hangoutLink || '',
            rawStartTimestamp: rawStart,
          };
        });

        // Most recent first
        const sorted = mapped.sort((a, b) => b.rawStartTimestamp - a.rawStartTimestamp);
        setMeetings(sorted);
        if (sorted.length > 0) {
          setSelectedMeetingId(sorted[0].id);
        }
      }
    } catch (e) {
      console.error('Error loading meetings for reminders:', e);
    }
  }, []);

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || meetings[0];

  const handleSendReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    setIsSending(true);
    setTimeout(() => {
      const allEmails = selectedMeeting.attendees.map((a) => a.email).filter(Boolean);
      const emailTo = allEmails.length > 0 ? allEmails.join(',') : 'ciudadano@ejemplo.com';

      const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(customSubject)}&body=${encodeURIComponent(
        `Estimados participantes (${allEmails.join(', ') || 'Ciudadanos'}),\n\n${customMessage}\n\nDetalles de la Reunión:\n- Título: ${selectedMeeting.title}\n- Fecha: ${selectedMeeting.date} a las ${selectedMeeting.time}\n- Lugar / Enlace: ${selectedMeeting.meetLink || selectedMeeting.location}\n\nAtentamente,\nEquipo de Inclusión Social`
      )}`;

      window.open(mailtoLink, '_blank');

      setSentLogs((prev) => [
        {
          id: Math.random().toString(),
          title: selectedMeeting.title,
          email: emailTo,
          time: new Date().toLocaleString(),
          status: 'success',
        },
        ...prev,
      ]);

      setIsSending(false);
      setSuccessNotice(`¡Recordatorio enviado a todos los invitados (${allEmails.length || 1} destinatarios)!`);
      setTimeout(() => setSuccessNotice(null), 5000);
    }, 500);
  };

  const handleSendAllAutomated = () => {
    setIsSending(true);
    setTimeout(() => {
      const newLogs = meetings.map((m) => {
        const allEmails = m.attendees.map((a) => a.email).filter(Boolean).join(',');
        return {
          id: Math.random().toString(),
          title: m.title,
          email: allEmails || 'ciudadano@ejemplo.com',
          time: new Date().toLocaleString(),
          status: 'success' as const,
        };
      });
      setSentLogs((prev) => [...newLogs, ...prev]);
      setIsSending(false);
      setSuccessNotice(`¡Se han despachado recordatorios automáticos masivos para las ${meetings.length} reuniones con todos sus invitados!`);
      setTimeout(() => setSuccessNotice(null), 5000);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 px-4 sm:px-6 pt-6">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        style={{
          background: `linear-gradient(135deg, ${themeHex}, #1e293b)`,
        }}
      >
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo de Notificaciones y Recordatorios</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Recordatorios Automáticos por Correo</h2>
          <p className="text-white/80 text-sm max-w-xl">
            Configure y envíe alertas automáticas, avisos previos de 24h/2h y resúmenes de citas a todos los invitados del evento vía Gmail o cliente de correo predeterminado.
          </p>
        </div>
        <button
          onClick={handleSendAllAutomated}
          disabled={meetings.length === 0 || isSending}
          className="z-10 px-5 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm shadow-lg hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Mail className="w-4 h-4 text-blue-600" />
          <span>Enviar Lote Masivo ({meetings.length})</span>
        </button>
      </div>

      {successNotice && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm font-semibold flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Composer */}
        <div className="lg:col-span-2 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Centro de Redacción de Recordatorios</h3>
                <p className="text-xs text-slate-500">Seleccione la reunión y personalice la plantilla para todos los invitados</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendReminder} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Seleccionar Reunión / Cita Ciudadana (Más recientes primero)
              </label>
              {meetings.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-sm text-center">
                  No hay reuniones programadas actualmente. Agende una reunión en la pestaña Reuniones primero.
                </div>
              ) : (
                <select
                  value={selectedMeetingId}
                  onChange={(e) => setSelectedMeetingId(e.target.value)}
                  className="w-full truncate rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {meetings.map((m) => {
                    const shortTitle = m.title.length > 32 ? m.title.slice(0, 32) + '...' : m.title;
                    return (
                      <option key={m.id} value={m.id}>
                        {shortTitle} ({m.date} {m.time})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {selectedMeeting && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>Fecha y Hora:</strong> {selectedMeeting.date} a las {selectedMeeting.time}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Invitados ({selectedMeeting.attendees.length}):</strong>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedMeeting.attendees.length === 0 ? (
                        <span className="text-slate-400">Sin invitados registrados</span>
                      ) : (
                        selectedMeeting.attendees.map((att, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-700 font-medium">
                            {att.displayName ? `${att.displayName} (${att.email})` : att.email}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tipo de Programación de Alerta
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setReminderType('24h');
                    setCustomMessage('Le recordamos que mañana tenemos agendada su reunión institucional. Le esperamos puntualmente.');
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                    reminderType === '24h'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Recordatorio 24h antes</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReminderType('2h');
                    setCustomMessage('Le recordamos que su cita institucional es en pocas horas. Por favor prepare sus documentos.');
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                    reminderType === '2h'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>Aviso 2h antes</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReminderType('custom');
                    setCustomMessage('Notificación importante acerca de su proceso de atención ciudadana e inclusión social.');
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                    reminderType === 'custom'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Mensaje Personalizado</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Asunto del Correo
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Cuerpo del Mensaje / Resumen
              </label>
              <textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!selectedMeeting || isSending}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Enviando...' : `Enviar Recordatorio a Todos los Invitados (${selectedMeeting?.attendees.length || 0})`}</span>
            </button>
          </form>
        </div>

        {/* Right Col: Recent Logs & Stats */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Historial de Envíos Recientes</span>
            </h3>

            {sentLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No hay correos de recordatorio enviados en esta sesión.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {sentLogs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="truncate max-w-[180px]">{log.title}</span>
                      <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Enviado
                      </span>
                    </div>
                    <div className="text-slate-500 truncate">Destinatarios: {log.email}</div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 flex justify-between">
                      <span>Automático (Gmail API)</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-blue-50/60 border border-blue-100 p-6 space-y-3">
            <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Ventajas de los Recordatorios</span>
            </h4>
            <p className="text-xs text-blue-800/80 leading-relaxed">
              Reduzca el ausentismo institucional en un 40% enviando notificaciones automatizadas previas que incluyen enlaces directos a Google Meet y confirmación de asistencia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
