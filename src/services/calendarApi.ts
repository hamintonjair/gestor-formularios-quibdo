import { GoogleApiAuthError } from './formsApi';

export interface CalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  self?: boolean;
}

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  hangoutLink?: string;
  htmlLink?: string;
  attendees?: CalendarAttendee[];
  creator?: {
    email?: string;
    displayName?: string;
    self?: boolean;
  };
  organizer?: {
    email?: string;
    displayName?: string;
    self?: boolean;
  };
  status?: string;
  created?: string;
  updated?: string;
}

/**
 * List events from primary Google Calendar
 */
export const listCalendarEvents = async (
  accessToken: string,
  timeMin?: string
): Promise<CalendarEventItem[]> => {
  // Default to 14 days ago to capture recent meetings plus upcoming ones
  const minTime =
    timeMin || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const url = new URL(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events'
  );
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', minTime);
  url.searchParams.set('maxResults', '100');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    throw new GoogleApiAuthError('La sesión de Google Calendar ha expirado.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || 'Error al obtener las reuniones de Google Calendar.'
    );
  }

  const data = await res.json();
  return (data.items || []) as CalendarEventItem[];
};

/**
 * Schedule a new meeting in primary Google Calendar with Google Meet
 */
export const scheduleMeetingWithDetails = async (
  accessToken: string,
  attendeeEmail: string,
  summary: string,
  description: string,
  startTime: Date,
  durationMinutes: number = 60
): Promise<CalendarEventItem> => {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  const eventPayload = {
    summary: summary.trim(),
    description: description.trim(),
    start: { dateTime: startTime.toISOString() },
    end: { dateTime: endTime.toISOString() },
    attendees: attendeeEmail.trim()
      ? attendeeEmail
          .split(',')
          .map((e) => ({ email: e.trim() }))
          .filter((a) => a.email.length > 0)
      : [],
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (response.status === 401) {
    throw new GoogleApiAuthError('La sesión de Google Workspace ha expirado.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || 'Error al programar la reunión en Google Calendar.'
    );
  }

  return (await response.json()) as CalendarEventItem;
};

/**
 * Update an existing meeting in Google Calendar
 */
export const updateCalendarMeeting = async (
  accessToken: string,
  eventId: string,
  updates: {
    summary: string;
    description: string;
    startTime: Date;
    durationMinutes: number;
    attendeeEmail: string;
  }
): Promise<CalendarEventItem> => {
  const endTime = new Date(
    updates.startTime.getTime() + updates.durationMinutes * 60000
  );

  const eventPayload = {
    summary: updates.summary.trim(),
    description: updates.description.trim(),
    start: { dateTime: updates.startTime.toISOString() },
    end: { dateTime: endTime.toISOString() },
    attendees: updates.attendeeEmail.trim()
      ? updates.attendeeEmail
          .split(',')
          .map((e) => ({ email: e.trim() }))
          .filter((a) => a.email.length > 0)
      : [],
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
      eventId
    )}?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (response.status === 401) {
    throw new GoogleApiAuthError('La sesión de Google Workspace ha expirado.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || 'Error al actualizar la reunión en Google Calendar.'
    );
  }

  return (await response.json()) as CalendarEventItem;
};

/**
 * Delete / Cancel an existing meeting in Google Calendar
 */
export const deleteCalendarMeeting = async (
  accessToken: string,
  eventId: string
): Promise<void> => {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
      eventId
    )}?sendUpdates=all`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
      },
    }
  );

  if (response.status === 401) {
    throw new GoogleApiAuthError('La sesión de Google Workspace ha expirado.');
  }

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || 'Error al cancelar la reunión en Google Calendar.'
    );
  }
};
