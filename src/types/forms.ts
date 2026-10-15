/**
 * Types for Google Forms & Drive APIs
 */

export interface GoogleDriveFile {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GoogleFormQuestionText {
  paragraph?: boolean;
}

export interface GoogleFormQuestionDate {
  includeTime?: boolean;
  includeYear?: boolean;
}

export interface GoogleFormQuestionChoice {
  type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
  options: { value: string }[];
}

export interface GoogleFormQuestion {
  questionId: string;
  required?: boolean;
  textQuestion?: GoogleFormQuestionText;
  dateQuestion?: GoogleFormQuestionDate;
  choiceQuestion?: GoogleFormQuestionChoice;
}

export interface GoogleFormItem {
  itemId: string;
  title?: string;
  description?: string;
  questionItem?: {
    question: GoogleFormQuestion;
  };
  questionGroupItem?: {
    questions: GoogleFormQuestion[];
  };
  imageItem?: {
    image: {
      sourceUri?: string;
      properties?: {
        alignment?: string;
        width?: number;
      };
    };
  };
}

export interface GoogleFormInfo {
  title: string;
  documentTitle?: string;
  description?: string;
}

export interface GoogleFormSchema {
  formId: string;
  info: GoogleFormInfo;
  settings?: Record<string, unknown>;
  items?: GoogleFormItem[];
  revisionId?: string;
  responderUri?: string;
}

export interface GoogleFormAnswerValue {
  value?: string;
}

export interface GoogleFormAnswer {
  questionId: string;
  textAnswers?: {
    answers?: GoogleFormAnswerValue[];
  };
  fileUploadAnswers?: {
    answers?: { fileId: string; fileName: string; mimeType: string }[];
  };
}

export interface GoogleFormResponseItem {
  responseId: string;
  createTime: string;
  lastSubmittedTime?: string;
  respondentEmail?: string;
  answers?: Record<string, GoogleFormAnswer>;
}

export interface GoogleFormResponsesList {
  responses?: GoogleFormResponseItem[];
  nextPageToken?: string;
}

export interface RegistrationRecord {
  id: string;
  submittedAt: string;
  nombre: string;
  correo: string;
  fechaRegistro: string;
  telefono?: string;
  documento?: string;
  rawAnswers: Record<string, { questionTitle: string; answerText: string }>;
  respondentEmail?: string;
}

export type DynamicQuestionType =
  | 'TEXT'
  | 'PARAGRAPH'
  | 'DATE'
  | 'RADIO'
  | 'CHECKBOX'
  | 'DROP_DOWN';

export interface DynamicFormField {
  id: string;
  title: string;
  description?: string;
  type: DynamicQuestionType;
  required: boolean;
  options?: string[];
  isSystemMandatory?: boolean; // For Nombre, Correo, Fecha de Registro
}
