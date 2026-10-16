import { GoogleApiAuthError } from './formsApi';

export interface GoogleContact {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  source: 'directorio' | 'otros_correos' | 'contactos' | 'ciudadano';
}

/**
 * Fetch all contacts from Google People API:
 * 1. Saved Contacts (Connections)
 * 2. Other Contacts (people with whom the user exchanged emails in Gmail)
 * 3. Domain Directory (Google Workspace directory)
 */
export const listGoogleContacts = async (
  accessToken: string
): Promise<GoogleContact[]> => {
  const contactsMap = new Map<string, GoogleContact>();

  const token = accessToken.trim();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Helper to safely extract and store contacts
  const extractAndAdd = (
    personList: unknown[],
    source: GoogleContact['source']
  ) => {
    if (!Array.isArray(personList)) return;

    for (const item of personList) {
      const person = item as {
        resourceName?: string;
        names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
        emailAddresses?: Array<{ value?: string }>;
        photos?: Array<{ url?: string; default?: boolean }>;
      };

      const name =
        person.names?.[0]?.displayName ||
        [person.names?.[0]?.givenName, person.names?.[0]?.familyName]
          .filter(Boolean)
          .join(' ') ||
        '';

      const emails = person.emailAddresses || [];
      const photoUrl = person.photos?.find((p) => !p.default)?.url || person.photos?.[0]?.url;

      for (const emailObj of emails) {
        const email = (emailObj.value || '').trim();
        if (email && email.includes('@')) {
          const lower = email.toLowerCase();
          const existing = contactsMap.get(lower);

          // Update if not existing or if current one has a better display name
          if (!existing) {
            contactsMap.set(lower, {
              id: person.resourceName || email,
              name: name || email.split('@')[0],
              email,
              photoUrl,
              source,
            });
          } else if (!existing.name && name) {
            existing.name = name;
            if (photoUrl && !existing.photoUrl) existing.photoUrl = photoUrl;
          }
        }
      }
    }
  };

  // 1. Fetch "Other Contacts" (The most important for Gmail autocomplete: anyone you've emailed or received emails from)
  try {
    const otherUrl = new URL('https://people.googleapis.com/v1/otherContacts');
    otherUrl.searchParams.set('readMask', 'names,emailAddresses,photos');
    otherUrl.searchParams.set('pageSize', '1000');

    const res = await fetch(otherUrl.toString(), { headers });
    if (res.status === 401) {
      throw new GoogleApiAuthError('La sesión ha expirado.');
    }
    if (res.ok) {
      const data = await res.json();
      extractAndAdd(data.otherContacts, 'otros_correos');
    }
  } catch (err) {
    if (err instanceof GoogleApiAuthError) throw err;
    console.warn('Could not load Google Other Contacts:', err);
  }

  // 2. Fetch Primary Saved Contacts (Connections)
  try {
    const connectionsUrl = new URL(
      'https://people.googleapis.com/v1/people/me/connections'
    );
    connectionsUrl.searchParams.set('personFields', 'names,emailAddresses,photos');
    connectionsUrl.searchParams.set('pageSize', '500');

    const res = await fetch(connectionsUrl.toString(), { headers });
    if (res.status === 401) {
      throw new GoogleApiAuthError('La sesión ha expirado.');
    }
    if (res.ok) {
      const data = await res.json();
      extractAndAdd(data.connections, 'contactos');
    }
  } catch (err) {
    if (err instanceof GoogleApiAuthError) throw err;
    console.warn('Could not load primary Google Contacts:', err);
  }

  // 3. Search Directory People (Workspace Domain Directory)
  try {
    const directoryUrl = new URL(
      'https://people.googleapis.com/v1/people:searchDirectoryPeople'
    );
    directoryUrl.searchParams.set('readMask', 'names,emailAddresses,photos');
    directoryUrl.searchParams.set('query', '');
    directoryUrl.searchParams.set(
      'sources',
      'DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE,DIRECTORY_SOURCE_TYPE_DOMAIN_CONTACT'
    );
    directoryUrl.searchParams.set('pageSize', '500');

    const res = await fetch(directoryUrl.toString(), { headers });
    if (res.ok) {
      const data = await res.json();
      extractAndAdd(data.people, 'directorio');
    }
  } catch (err) {
    console.warn('Could not load Directory People:', err);
  }

  return Array.from(contactsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};

/**
 * Real-time search in Google People API when user is typing
 */
export const searchGooglePeopleRealtime = async (
  accessToken: string,
  query: string
): Promise<GoogleContact[]> => {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const results: GoogleContact[] = [];
  const seenEmails = new Set<string>();

  const token = accessToken.trim();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 1. Search in Other Contacts (Gmail frequent interactions)
  try {
    const otherSearchUrl = new URL(
      'https://people.googleapis.com/v1/otherContacts:search'
    );
    otherSearchUrl.searchParams.set('query', cleanQ);
    otherSearchUrl.searchParams.set('readMask', 'names,emailAddresses,photos');
    otherSearchUrl.searchParams.set('pageSize', '20');

    const res = await fetch(otherSearchUrl.toString(), { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          const person = item.person;
          const name = person?.names?.[0]?.displayName || '';
          const emails = person?.emailAddresses || [];
          const photoUrl = person?.photos?.[0]?.url;

          for (const emailObj of emails) {
            const email = (emailObj.value || '').trim();
            if (email && email.includes('@') && !seenEmails.has(email.toLowerCase())) {
              seenEmails.add(email.toLowerCase());
              results.push({
                id: person.resourceName || email,
                name: name || email.split('@')[0],
                email,
                photoUrl,
                source: 'otros_correos',
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error in search other contacts:', err);
  }

  // 2. Search in Directory People (Google Workspace)
  try {
    const dirSearchUrl = new URL(
      'https://people.googleapis.com/v1/people:searchDirectoryPeople'
    );
    dirSearchUrl.searchParams.set('query', cleanQ);
    dirSearchUrl.searchParams.set('readMask', 'names,emailAddresses,photos');
    dirSearchUrl.searchParams.set(
      'sources',
      'DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE,DIRECTORY_SOURCE_TYPE_DOMAIN_CONTACT'
    );
    dirSearchUrl.searchParams.set('pageSize', '20');

    const res = await fetch(dirSearchUrl.toString(), { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.people)) {
        for (const person of data.people) {
          const name = person?.names?.[0]?.displayName || '';
          const emails = person?.emailAddresses || [];
          const photoUrl = person?.photos?.[0]?.url;

          for (const emailObj of emails) {
            const email = (emailObj.value || '').trim();
            if (email && email.includes('@') && !seenEmails.has(email.toLowerCase())) {
              seenEmails.add(email.toLowerCase());
              results.push({
                id: person.resourceName || email,
                name: name || email.split('@')[0],
                email,
                photoUrl,
                source: 'directorio',
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error in search directory people:', err);
  }

  return results;
};
