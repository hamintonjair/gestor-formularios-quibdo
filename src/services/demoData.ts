import { GoogleDriveFile, GoogleFormSchema, RegistrationRecord } from '../types/forms';

export const INITIAL_DEMO_DRIVE_FORMS: GoogleDriveFile[] = [
  {
    id: 'demo-form-caracterizacion-2025',
    name: 'Formulario de Registro y Caracterización de Ciudadanos 2025',
    createdTime: '2025-01-10T08:30:00.000Z',
    modifiedTime: '2025-02-14T15:20:00.000Z',
    webViewLink: 'https://docs.google.com/forms/d/demo-form-caracterizacion-2025/edit',
  },
  {
    id: 'demo-form-satisfaccion',
    name: 'Encuesta de Satisfacción y Trámites Institucionales',
    createdTime: '2025-01-15T10:00:00.000Z',
    modifiedTime: '2025-02-10T12:00:00.000Z',
    webViewLink: 'https://docs.google.com/forms/d/demo-form-satisfaccion/edit',
  },
  {
    id: 'demo-form-asistencia',
    name: 'Registro de Asistencia a Jornadas Comunitarias',
    createdTime: '2025-01-20T09:00:00.000Z',
    modifiedTime: '2025-02-05T16:45:00.000Z',
    webViewLink: 'https://docs.google.com/forms/d/demo-form-asistencia/edit',
  },
];

export const INITIAL_DEMO_SPREADSHEET: GoogleDriveFile = {
  id: 'demo-sheet-respuestas-2025',
  name: 'Formulario de Registro y Caracterización de Ciudadanos 2025 (Respuestas)',
  createdTime: '2025-01-10T08:31:00.000Z',
  modifiedTime: '2025-02-14T15:21:00.000Z',
  webViewLink: 'https://docs.google.com/spreadsheets/d/demo-sheet-respuestas-2025/edit',
};

export const INITIAL_DEMO_FORMS_MAP: Record<string, { schema: GoogleFormSchema; records: RegistrationRecord[] }> = {
  'demo-form-caracterizacion-2025': {
    schema: {
      formId: 'demo-form-caracterizacion-2025',
      info: {
        title: 'Formulario de Registro y Caracterización de Ciudadanos 2025',
        description: 'Registro oficial de ciudadanos para la gestión de trámites, programas sociales y atención comunitaria.',
        documentTitle: 'Registro y Caracterización 2025',
      },
      responderUri: 'https://docs.google.com/forms/d/e/1FAIpQLSc-demo-caracterizacion/viewform',
      items: [
        {
          itemId: 'item-1',
          title: 'Nombre Completo',
          questionItem: {
            question: {
              questionId: 'q-nombre',
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        {
          itemId: 'item-2',
          title: 'Correo Electrónico',
          questionItem: {
            question: {
              questionId: 'q-correo',
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        {
          itemId: 'item-3',
          title: 'Fecha de Registro',
          questionItem: {
            question: {
              questionId: 'q-fecha',
              required: true,
              dateQuestion: { includeYear: true, includeTime: false },
            },
          },
        },
        {
          itemId: 'item-4',
          title: 'Número de Documento (Cédula)',
          questionItem: {
            question: {
              questionId: 'q-doc',
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        {
          itemId: 'item-5',
          title: 'Teléfono de Contacto',
          questionItem: {
            question: {
              questionId: 'q-tel',
              required: false,
              textQuestion: { paragraph: false },
            },
          },
        },
        {
          itemId: 'item-6',
          title: 'Comuna o Localidad de Residencia',
          questionItem: {
            question: {
              questionId: 'q-localidad',
              required: true,
              choiceQuestion: {
                type: 'DROP_DOWN',
                options: [
                  { value: 'Comuna 1 - Centro Histórico' },
                  { value: 'Comuna 2 - Norte' },
                  { value: 'Comuna 3 - Occidente' },
                  { value: 'Comuna 4 - Sur Oriente' },
                  { value: 'Zona Rural / Corregimiento' },
                ],
              },
            },
          },
        },
        {
          itemId: 'item-7',
          title: 'Tipo de Población o Enfoque Diferencial',
          questionItem: {
            question: {
              questionId: 'q-poblacion',
              required: false,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Adulto Mayor' },
                  { value: 'Madre Comunitaria / Cabeza de Hogar' },
                  { value: 'Juventudes' },
                  { value: 'Persona con Discapacidad' },
                  { value: 'Población General' },
                ],
              },
            },
          },
        },
      ],
    },
    records: [
      {
        id: 'rec-1',
        submittedAt: '2025-02-14T14:30:00.000Z',
        nombre: 'María Camila Restrepo Gómez',
        correo: 'camila.restrepo@example.com',
        fechaRegistro: '2025-02-14',
        telefono: '315 889 4421',
        documento: '1.032.485.912',
        respondentEmail: 'camila.restrepo@example.com',
        rawAnswers: {
          'q-nombre': { questionTitle: 'Nombre Completo', answerText: 'María Camila Restrepo Gómez' },
          'q-correo': { questionTitle: 'Correo Electrónico', answerText: 'camila.restrepo@example.com' },
          'q-fecha': { questionTitle: 'Fecha de Registro', answerText: '2025-02-14' },
          'q-doc': { questionTitle: 'Número de Documento (Cédula)', answerText: '1.032.485.912' },
          'q-tel': { questionTitle: 'Teléfono de Contacto', answerText: '315 889 4421' },
          'q-localidad': { questionTitle: 'Comuna o Localidad de Residencia', answerText: 'Comuna 1 - Centro Histórico' },
          'q-poblacion': { questionTitle: 'Tipo de Población o Enfoque Diferencial', answerText: 'Madre Comunitaria / Cabeza de Hogar' },
        },
      },
      {
        id: 'rec-2',
        submittedAt: '2025-02-13T11:15:00.000Z',
        nombre: 'Juan David Martínez Silva',
        correo: 'jdmartinez@example.com',
        fechaRegistro: '2025-02-13',
        telefono: '310 445 6789',
        documento: '79.845.120',
        respondentEmail: 'jdmartinez@example.com',
        rawAnswers: {
          'q-nombre': { questionTitle: 'Nombre Completo', answerText: 'Juan David Martínez Silva' },
          'q-correo': { questionTitle: 'Correo Electrónico', answerText: 'jdmartinez@example.com' },
          'q-fecha': { questionTitle: 'Fecha de Registro', answerText: '2025-02-13' },
          'q-doc': { questionTitle: 'Número de Documento (Cédula)', answerText: '79.845.120' },
          'q-tel': { questionTitle: 'Teléfono de Contacto', answerText: '310 445 6789' },
          'q-localidad': { questionTitle: 'Comuna o Localidad de Residencia', answerText: 'Comuna 3 - Occidente' },
          'q-poblacion': { questionTitle: 'Tipo de Población o Enfoque Diferencial', answerText: 'Adulto Mayor' },
        },
      },
      {
        id: 'rec-3',
        submittedAt: '2025-02-12T16:40:00.000Z',
        nombre: 'Laura Sofía Henao Pérez',
        correo: 'laura.henao@example.com',
        fechaRegistro: '2025-02-12',
        telefono: '320 123 9874',
        documento: '1.144.567.890',
        respondentEmail: 'laura.henao@example.com',
        rawAnswers: {
          'q-nombre': { questionTitle: 'Nombre Completo', answerText: 'Laura Sofía Henao Pérez' },
          'q-correo': { questionTitle: 'Correo Electrónico', answerText: 'laura.henao@example.com' },
          'q-fecha': { questionTitle: 'Fecha de Registro', answerText: '2025-02-12' },
          'q-doc': { questionTitle: 'Número de Documento (Cédula)', answerText: '1.144.567.890' },
          'q-tel': { questionTitle: 'Teléfono de Contacto', answerText: '320 123 9874' },
          'q-localidad': { questionTitle: 'Comuna o Localidad de Residencia', answerText: 'Comuna 2 - Norte' },
          'q-poblacion': { questionTitle: 'Tipo de Población o Enfoque Diferencial', answerText: 'Juventudes' },
        },
      },
      {
        id: 'rec-4',
        submittedAt: '2025-02-11T09:20:00.000Z',
        nombre: 'Carlos Eduardo Benítez Ospina',
        correo: 'carlos.benitez@example.com',
        fechaRegistro: '2025-02-11',
        telefono: '318 654 3210',
        documento: '98.765.432',
        respondentEmail: 'carlos.benitez@example.com',
        rawAnswers: {
          'q-nombre': { questionTitle: 'Nombre Completo', answerText: 'Carlos Eduardo Benítez Ospina' },
          'q-correo': { questionTitle: 'Correo Electrónico', answerText: 'carlos.benitez@example.com' },
          'q-fecha': { questionTitle: 'Fecha de Registro', answerText: '2025-02-11' },
          'q-doc': { questionTitle: 'Número de Documento (Cédula)', answerText: '98.765.432' },
          'q-tel': { questionTitle: 'Teléfono de Contacto', answerText: '318 654 3210' },
          'q-localidad': { questionTitle: 'Comuna o Localidad de Residencia', answerText: 'Zona Rural / Corregimiento' },
          'q-poblacion': { questionTitle: 'Tipo de Población o Enfoque Diferencial', answerText: 'Población General' },
        },
      },
      {
        id: 'rec-5',
        submittedAt: '2025-02-10T15:05:00.000Z',
        nombre: 'Ana María Morales Duarte',
        correo: 'ana.morales@example.com',
        fechaRegistro: '2025-02-10',
        telefono: '311 987 6543',
        documento: '52.345.678',
        respondentEmail: 'ana.morales@example.com',
        rawAnswers: {
          'q-nombre': { questionTitle: 'Nombre Completo', answerText: 'Ana María Morales Duarte' },
          'q-correo': { questionTitle: 'Correo Electrónico', answerText: 'ana.morales@example.com' },
          'q-fecha': { questionTitle: 'Fecha de Registro', answerText: '2025-02-10' },
          'q-doc': { questionTitle: 'Número de Documento (Cédula)', answerText: '52.345.678' },
          'q-tel': { questionTitle: 'Teléfono de Contacto', answerText: '311 987 6543' },
          'q-localidad': { questionTitle: 'Comuna o Localidad de Residencia', answerText: 'Comuna 4 - Sur Oriente' },
          'q-poblacion': { questionTitle: 'Tipo de Población o Enfoque Diferencial', answerText: 'Persona con Discapacidad' },
        },
      },
    ],
  },
  'demo-form-satisfaccion': {
    schema: {
      formId: 'demo-form-satisfaccion',
      info: {
        title: 'Encuesta de Satisfacción y Trámites Institucionales',
        description: 'Mecanismo de retroalimentación para evaluar la calidad en la atención a ciudadanos.',
        documentTitle: 'Encuesta de Satisfacción',
      },
      responderUri: 'https://docs.google.com/forms/d/e/1FAIpQLSc-demo-satisfaccion/viewform',
      items: [
        {
          itemId: 'sat-1',
          title: 'Nombre Completo',
          questionItem: {
            question: { questionId: 'sat-q1', required: true, textQuestion: { paragraph: false } },
          },
        },
        {
          itemId: 'sat-2',
          title: 'Correo Electrónico',
          questionItem: {
            question: { questionId: 'sat-q2', required: true, textQuestion: { paragraph: false } },
          },
        },
        {
          itemId: 'sat-3',
          title: 'Fecha de Registro',
          questionItem: {
            question: { questionId: 'sat-q3', required: true, dateQuestion: { includeYear: true } },
          },
        },
        {
          itemId: 'sat-4',
          title: 'Nivel de Satisfacción General',
          questionItem: {
            question: {
              questionId: 'sat-q4',
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [{ value: 'Excelente' }, { value: 'Bueno' }, { value: 'Regular' }, { value: 'Por mejorar' }],
              },
            },
          },
        },
      ],
    },
    records: [
      {
        id: 'sat-rec-1',
        submittedAt: '2025-02-14T09:40:00.000Z',
        nombre: 'Diego Alejandro Vargas',
        correo: 'diego.vargas@example.com',
        fechaRegistro: '2025-02-14',
        respondentEmail: 'diego.vargas@example.com',
        rawAnswers: {
          'sat-q1': { questionTitle: 'Nombre Completo', answerText: 'Diego Alejandro Vargas' },
          'sat-q2': { questionTitle: 'Correo Electrónico', answerText: 'diego.vargas@example.com' },
          'sat-q3': { questionTitle: 'Fecha de Registro', answerText: '2025-02-14' },
          'sat-q4': { questionTitle: 'Nivel de Satisfacción General', answerText: 'Excelente' },
        },
      },
      {
        id: 'sat-rec-2',
        submittedAt: '2025-02-13T14:10:00.000Z',
        nombre: 'Patricia Elena Correa',
        correo: 'patricia.correa@example.com',
        fechaRegistro: '2025-02-13',
        respondentEmail: 'patricia.correa@example.com',
        rawAnswers: {
          'sat-q1': { questionTitle: 'Nombre Completo', answerText: 'Patricia Elena Correa' },
          'sat-q2': { questionTitle: 'Correo Electrónico', answerText: 'patricia.correa@example.com' },
          'sat-q3': { questionTitle: 'Fecha de Registro', answerText: '2025-02-13' },
          'sat-q4': { questionTitle: 'Nivel de Satisfacción General', answerText: 'Bueno' },
        },
      },
    ],
  },
  'demo-form-asistencia': {
    schema: {
      formId: 'demo-form-asistencia',
      info: {
        title: 'Registro de Asistencia a Jornadas Comunitarias',
        description: 'Control de asistencia presencial a eventos y talleres de participación.',
        documentTitle: 'Registro de Asistencia',
      },
      responderUri: 'https://docs.google.com/forms/d/e/1FAIpQLSc-demo-asistencia/viewform',
      items: [
        {
          itemId: 'asis-1',
          title: 'Nombre Completo',
          questionItem: {
            question: { questionId: 'asis-q1', required: true, textQuestion: { paragraph: false } },
          },
        },
        {
          itemId: 'asis-2',
          title: 'Correo Electrónico',
          questionItem: {
            question: { questionId: 'asis-q2', required: true, textQuestion: { paragraph: false } },
          },
        },
        {
          itemId: 'asis-3',
          title: 'Fecha de Registro',
          questionItem: {
            question: { questionId: 'asis-q3', required: true, dateQuestion: { includeYear: true } },
          },
        },
        {
          itemId: 'asis-4',
          title: 'Taller o Mesa Temática',
          questionItem: {
            question: {
              questionId: 'asis-q4',
              required: true,
              choiceQuestion: {
                type: 'DROP_DOWN',
                options: [
                  { value: 'Presupuesto Participativo' },
                  { value: 'Gestión Ambiental y Hábitat' },
                  { value: 'Salud y Bienestar Familiar' },
                ],
              },
            },
          },
        },
      ],
    },
    records: [
      {
        id: 'asis-rec-1',
        submittedAt: '2025-02-12T10:00:00.000Z',
        nombre: 'Andrés Felipe Morales',
        correo: 'andres.felipe@example.com',
        fechaRegistro: '2025-02-12',
        respondentEmail: 'andres.felipe@example.com',
        rawAnswers: {
          'asis-q1': { questionTitle: 'Nombre Completo', answerText: 'Andrés Felipe Morales' },
          'asis-q2': { questionTitle: 'Correo Electrónico', answerText: 'andres.felipe@example.com' },
          'asis-q3': { questionTitle: 'Fecha de Registro', answerText: '2025-02-12' },
          'asis-q4': { questionTitle: 'Taller o Mesa Temática', answerText: 'Presupuesto Participativo' },
        },
      },
    ],
  },
};
