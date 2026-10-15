import {
  DynamicFormField,
  GoogleDriveFile,
  GoogleFormResponseItem,
  GoogleFormResponsesList,
  GoogleFormSchema,
  RegistrationRecord,
} from '../types/forms';

export class GoogleApiAuthError extends Error {
  constructor(message?: string) {
    super(
      message ||
        'La sesión de Google Workspace ha expirado o no tiene los permisos necesarios para acceder a Google Forms.'
    );
    this.name = 'GoogleApiAuthError';
  }
}

/**
 * Clean and extract a Google Form ID from a raw ID or Google Forms URL.
 */
export const extractFormId = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const matchD = trimmed.match(/\/forms\/d\/([a-zA-Z0-9_-]{15,})/);
  if (matchD && matchD[1]) {
    return matchD[1];
  }

  const matchE = trimmed.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]{15,})/);
  if (matchE && matchE[1]) {
    return matchE[1];
  }

  const cleanId = trimmed.split('/')[0].split('?')[0];
  return cleanId;
};

/**
 * List forms available in user's Google Drive
 */
export const listDriveForms = async (accessToken: string): Promise<GoogleDriveFile[]> => {
  try {
    const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.form' and trashed = false");
    const fields = encodeURIComponent('files(id, name, createdTime, modifiedTime, webViewLink)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime%20desc&pageSize=30&fields=${fields}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
        Accept: 'application/json',
      },
    });

    if (res.status === 401) {
      throw new GoogleApiAuthError(
        'Las credenciales de Google Workspace han expirado o no están autorizadas. Por favor reingresa.'
      );
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn('Drive listing warning (non-fatal):', errorData);
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    if (err instanceof GoogleApiAuthError) throw err;
    console.warn('Error querying Google Drive forms:', err);
    return [];
  }
};

/**
 * Search Drive for the Google Sheets spreadsheet linked to this form's responses.
 */
export const findLinkedSpreadsheet = async (
  accessToken: string,
  formTitle: string
): Promise<GoogleDriveFile | null> => {
  try {
    if (!formTitle) return null;
    const cleanTitle = formTitle.replace(/['"]/g, '').trim();
    // In Google Drive, linked form sheets typically contain the form title or end with (Respuestas)/(Responses)
    const query = encodeURIComponent(
      `mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false and name contains '${cleanTitle}'`
    );
    const fields = encodeURIComponent('files(id, name, createdTime, modifiedTime, webViewLink)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime%20desc&pageSize=5&fields=${fields}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
    return null;
  } catch (e) {
    console.warn('Could not search for linked spreadsheet in Drive:', e);
    return null;
  }
};

/**
 * Fetch Google Form structure and metadata by Form ID
 */
export const getFormDetails = async (
  accessToken: string,
  formId: string
): Promise<GoogleFormSchema> => {
  const safeFormId = encodeURIComponent(formId.trim());
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${safeFormId}`, {
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 401) {
    throw new GoogleApiAuthError(
      'La sesión de Google Workspace ha expirado. Por favor vuelve a iniciar sesión para autorizar Google Forms.'
    );
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `No se pudo cargar el formulario (${res.status}). Verifique los permisos o el ID del formulario.`
    );
  }

  return (await res.json()) as GoogleFormSchema;
};

/**
 * Fetch all responses for a given Google Form
 */
export const getFormResponses = async (
  accessToken: string,
  formId: string
): Promise<GoogleFormResponseItem[]> => {
  const safeFormId = encodeURIComponent(formId.trim());
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${safeFormId}/responses`, {
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 401) {
    throw new GoogleApiAuthError(
      'La sesión de Google Workspace ha expirado. Por favor vuelve a iniciar sesión para autorizar Google Forms.'
    );
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `No se pudieron obtener las respuestas del formulario (${res.status}).`
    );
  }

  const data = (await res.json()) as GoogleFormResponsesList;
  return data.responses || [];
};

/**
 * Helper to build batchUpdate question request for Google Forms API
 */
const buildCreateItemRequest = (field: DynamicFormField, index: number) => {
  const question: Record<string, unknown> = {
    required: field.required,
  };

  switch (field.type) {
    case 'PARAGRAPH':
      question.textQuestion = { paragraph: true };
      break;
    case 'DATE':
      question.dateQuestion = { includeTime: false, includeYear: true };
      break;
    case 'RADIO':
    case 'CHECKBOX':
    case 'DROP_DOWN': {
      const opts = field.options && field.options.length > 0 ? field.options : ['Opción 1', 'Opción 2'];
      question.choiceQuestion = {
        type: field.type,
        options: opts.map((o) => ({ value: o })),
      };
      break;
    }
    case 'TEXT':
    default:
      question.textQuestion = { paragraph: false };
      break;
  }

  return {
    createItem: {
      item: {
        title: field.title.trim(),
        description: field.description?.trim() || undefined,
        questionItem: {
          question,
        },
      },
      location: { index },
    },
  };
};

/**
 * Create a new dynamic Google Form according to specific user needs
 */
export const createCustomRegistrationForm = async (
  accessToken: string,
  title: string,
  description: string,
  fields: DynamicFormField[],
  logoUrl?: string | null
): Promise<GoogleFormSchema> => {
  // Step 1: Create empty form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: title.trim(),
      },
    }),
  });

  if (createRes.status === 401) {
    throw new GoogleApiAuthError('La sesión ha expirado.');
  }

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al inicializar el formulario');
  }

  const newForm = (await createRes.json()) as GoogleFormSchema;
  const safeFormId = encodeURIComponent(newForm.formId);

  // Step 2: BatchUpdate with description, logo image (if public URL) and all configured fields
  const batchRequests: Record<string, unknown>[] = [];

  if (description?.trim()) {
    batchRequests.push({
      updateFormInfo: {
        info: {
          description: description.trim(),
        },
        updateMask: 'description',
      },
    });
  }

  let currentIndex = 0;

  // If a valid HTTP/HTTPS logo URL is provided, inject an imageItem banner at top of form
  if (logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'))) {
    batchRequests.push({
      createItem: {
        item: {
          title: 'Alcaldía de Quibdó · Secretaría de Inclusión y Cohesión Social',
          description: 'Logotipo Oficial Institucional',
          imageItem: {
            image: {
              sourceUri: logoUrl,
              properties: {
                alignment: 'CENTER',
                width: 320,
              },
            },
          },
        },
        location: { index: currentIndex },
      },
    });
    currentIndex++;
  }

  fields.forEach((field) => {
    batchRequests.push(buildCreateItemRequest(field, currentIndex));
    currentIndex++;
  });

  const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${safeFormId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      includeFormInResponse: true,
      requests: batchRequests,
    }),
  });

  if (updateRes.status === 401) {
    throw new GoogleApiAuthError('La sesión ha expirado.');
  }

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    console.warn('Batch update issue, returning basic form:', err);
    return newForm;
  }

  const updateData = await updateRes.json();
  return updateData.form || newForm;
};

/**
 * Append additional dynamic questions to an existing Google Form
 */
export const addQuestionsToExistingForm = async (
  accessToken: string,
  formId: string,
  newFields: DynamicFormField[],
  startingIndex: number
): Promise<GoogleFormSchema> => {
  const safeFormId = encodeURIComponent(formId.trim());
  const batchRequests = newFields.map((field, i) =>
    buildCreateItemRequest(field, startingIndex + i)
  );

  const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${safeFormId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      includeFormInResponse: true,
      requests: batchRequests,
    }),
  });

  if (updateRes.status === 401) {
    throw new GoogleApiAuthError('La sesión ha expirado.');
  }

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al agregar preguntas adicionales al formulario.');
  }

  const updateData = await updateRes.json();
  return updateData.form;
};

/**
 * Add or update header banner image in an existing Google Form via Forms API
 */
export const addHeaderImageToExistingForm = async (
  accessToken: string,
  formId: string,
  imageUrl: string,
  imageTitle?: string
): Promise<GoogleFormSchema> => {
  const safeFormId = encodeURIComponent(formId.trim());
  const batchRequests = [
    {
      createItem: {
        item: {
          title: imageTitle || 'Alcaldía de Quibdó · Secretaría de Inclusión y Cohesión Social',
          description: 'Encabezado institucional oficial',
          imageItem: {
            image: {
              sourceUri: imageUrl.trim(),
              properties: {
                alignment: 'CENTER',
                width: 320,
              },
            },
          },
        },
        location: { index: 0 },
      },
    },
  ];

  const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${safeFormId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      includeFormInResponse: true,
      requests: batchRequests,
    }),
  });

  if (updateRes.status === 401) {
    throw new GoogleApiAuthError('La sesión ha expirado.');
  }

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al insertar la imagen en el formulario de Google.');
  }

  const updateData = await updateRes.json();
  return updateData.form;
};

/**
 * Format ISO date string into readable Spanish locale format
 */
export const formatDate = (isoString?: string): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

/**
 * Parse raw Google Forms response into structured RegistrationRecord
 * with automatic detection of Nombre, Correo, and Fecha de Registro,
 * plus all dynamic answers.
 */
export const parseRegistrationRecords = (
  responses: GoogleFormResponseItem[],
  schema: GoogleFormSchema
): RegistrationRecord[] => {
  const questionMap = new Map<string, { title: string; index: number }>();
  let idx = 0;

  if (schema.items) {
    for (const item of schema.items) {
      if (item.questionItem?.question) {
        questionMap.set(item.questionItem.question.questionId, {
          title: item.title || `Pregunta ${idx + 1}`,
          index: idx,
        });
        idx++;
      }
    }
  }

  return responses.map((resp) => {
    let detectedNombre = '';
    let detectedCorreo = resp.respondentEmail || '';
    let detectedFecha = '';
    let detectedTelefono = '';
    let detectedDocumento = '';
    const rawAnswers: Record<string, { questionTitle: string; answerText: string }> = {};

    if (resp.answers) {
      for (const [qId, ans] of Object.entries(resp.answers)) {
        const qInfo = questionMap.get(qId);
        const title = qInfo?.title || 'Pregunta';
        const lowerTitle = title.toLowerCase();

        const values: string[] = [];
        if (ans.textAnswers?.answers) {
          for (const a of ans.textAnswers.answers) {
            if (a.value) values.push(a.value);
          }
        }
        if (ans.fileUploadAnswers?.answers) {
          for (const f of ans.fileUploadAnswers.answers) {
            values.push(f.fileName);
          }
        }
        const answerText = values.join(', ').trim();
        rawAnswers[qId] = { questionTitle: title, answerText };

        // Detection heuristics for Nombre
        if (
          !detectedNombre &&
          (lowerTitle.includes('nombre') ||
            lowerTitle.includes('apellido') ||
            lowerTitle.includes('name') ||
            lowerTitle.includes('persona'))
        ) {
          detectedNombre = answerText;
        }

        // Detection heuristics for Correo Electrónico
        if (
          !detectedCorreo &&
          (lowerTitle.includes('correo') ||
            lowerTitle.includes('email') ||
            lowerTitle.includes('mail') ||
            answerText.includes('@'))
        ) {
          detectedCorreo = answerText;
        }

        // Detection heuristics for Fecha de Registro
        if (
          !detectedFecha &&
          (lowerTitle.includes('fecha') || lowerTitle.includes('date') || lowerTitle.includes('registro'))
        ) {
          detectedFecha = answerText;
        }

        // Detection for Documento
        if (
          !detectedDocumento &&
          (lowerTitle.includes('documento') ||
            lowerTitle.includes('cédula') ||
            lowerTitle.includes('cedula') ||
            lowerTitle.includes('identificación') ||
            lowerTitle.includes('dni'))
        ) {
          detectedDocumento = answerText;
        }

        // Detection for Teléfono
        if (
          !detectedTelefono &&
          (lowerTitle.includes('teléfono') ||
            lowerTitle.includes('telefono') ||
            lowerTitle.includes('celular') ||
            lowerTitle.includes('móvil') ||
            lowerTitle.includes('phone'))
        ) {
          detectedTelefono = answerText;
        }
      }
    }

    if (!detectedNombre && Object.values(rawAnswers).length > 0) {
      detectedNombre = Object.values(rawAnswers)[0].answerText;
    }
    if (!detectedNombre) {
      detectedNombre = resp.respondentEmail ? resp.respondentEmail.split('@')[0] : 'Sin nombre especificado';
    }

    if (!detectedCorreo) {
      detectedCorreo = resp.respondentEmail || 'No especificado';
    }

    if (!detectedFecha) {
      detectedFecha = resp.createTime;
    }

    return {
      id: resp.responseId,
      submittedAt: resp.createTime,
      nombre: detectedNombre,
      correo: detectedCorreo,
      fechaRegistro: detectedFecha,
      telefono: detectedTelefono,
      documento: detectedDocumento,
      rawAnswers,
      respondentEmail: resp.respondentEmail,
    };
  });
};

/**
 * Delete a Google Form by moving it to Google Drive Trash (or permanently)
 */
export const deleteFormFromDrive = async (accessToken: string, fileId: string): Promise<void> => {
  const safeId = encodeURIComponent(fileId.trim());

  // Move to trash in Google Drive
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${safeId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trashed: true }),
  });

  if (res.status === 401) {
    throw new GoogleApiAuthError('La sesión de Google Workspace ha expirado.');
  }

  if (!res.ok) {
    // If PATCH is not accepted, fallback to DELETE
    const delRes = await fetch(`https://www.googleapis.com/drive/v3/files/${safeId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
      },
    });

    if (delRes.status === 401) {
      throw new GoogleApiAuthError('La sesión de Google Workspace ha expirado.');
    }

    if (!delRes.ok && delRes.status !== 204) {
      const err = await delRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Error al eliminar el formulario en Google Drive.');
    }
  }
};

