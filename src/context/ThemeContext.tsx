import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BrandingConfig,
  THEME_PRESETS,
  ThemeConfig,
  ThemeId,
  GoogleFormThemeProperties,
  DEFAULT_FORM_THEME,
} from '../types/theme';

import { GoogleFormSchema } from '../types/forms';

interface ThemeContextType {
  branding: BrandingConfig;
  currentTheme: ThemeConfig;
  formTheme: GoogleFormThemeProperties;
  setTheme: (id: ThemeId) => void;
  setLogo: (url: string | null) => void;
  updateFormTheme: (updates: Partial<GoogleFormThemeProperties>) => void;
  loadPropertiesFromGoogleForm: (schema: GoogleFormSchema) => void;
  saveFormThemeForId: (formId: string, customTheme?: GoogleFormThemeProperties) => void;
  setInstitutionDetails: (name: string, sub: string) => void;
  resetBranding: () => void;
}

const STORAGE_KEY = 'app_branding_config_v2';

const DEFAULT_BRANDING: BrandingConfig = {
  institutionName: 'Gestor de Formularios y Registros',
  subHeader: 'Alcaldía de Quibdó · Secretaría de Inclusión y Cohesión Social',
  logoUrl: null,
  logoType: 'default',
  themeId: 'amber',
  formTheme: DEFAULT_FORM_THEME,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_BRANDING,
          ...parsed,
          formTheme: { ...DEFAULT_FORM_THEME, ...(parsed.formTheme || {}) },
        };
      }
    } catch (e) {
      console.warn('Could not read saved branding preferences:', e);
    }
    return DEFAULT_BRANDING;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    } catch (e) {
      console.warn('Could not save branding preferences:', e);
    }
  }, [branding]);

  const setTheme = (id: ThemeId) => {
    const preset = THEME_PRESETS[id];
    setBranding((prev) => ({
      ...prev,
      themeId: id,
      formTheme: {
        ...prev.formTheme,
        themeColor: preset.primaryHex,
        backgroundColor: `${preset.primaryHex}15`,
      },
    }));
  };

  const setLogo = (url: string | null) => {
    setBranding((prev) => ({
      ...prev,
      logoUrl: url,
      logoType: url ? 'custom' : 'default',
      formTheme: {
        ...prev.formTheme,
        headerImageUrl: url,
      },
    }));
  };

  const updateFormTheme = (updates: Partial<GoogleFormThemeProperties>) => {
    setBranding((prev) => ({
      ...prev,
      formTheme: {
        ...prev.formTheme,
        ...updates,
      },
      ...(updates.headerImageUrl !== undefined
        ? { logoUrl: updates.headerImageUrl }
        : {}),
    }));
  };

  const loadPropertiesFromGoogleForm = (schema: GoogleFormSchema) => {
    if (!schema) return;

    // 1. Try reading stored theme preferences for this specific form
    const formKey = `google_form_theme_${schema.formId}`;
    try {
      const stored = localStorage.getItem(formKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBranding((prev) => ({
          ...prev,
          formTheme: { ...prev.formTheme, ...parsed },
          ...(parsed.headerImageUrl ? { logoUrl: parsed.headerImageUrl } : {}),
        }));
        return;
      }
    } catch (e) {
      console.warn('Could not read form theme from localStorage:', e);
    }

    // 2. Otherwise scan form items for any imageItem (e.g. institutional header/logo banner)
    let foundImageUri: string | null = null;
    let foundImageTitle = '';

    if (schema.items) {
      for (const item of schema.items) {
        if (item.imageItem?.image?.sourceUri) {
          foundImageUri = item.imageItem.image.sourceUri;
          foundImageTitle = item.title || 'Encabezado Google Forms';
          break;
        }
      }
    }

    if (foundImageUri) {
      setBranding((prev) => ({
        ...prev,
        formTheme: {
          ...prev.formTheme,
          headerImageUrl: foundImageUri,
          headerImageName: foundImageTitle,
        },
        logoUrl: foundImageUri,
      }));
    }
  };

  const saveFormThemeForId = (formId: string, customTheme?: GoogleFormThemeProperties) => {
    if (!formId) return;
    const themeToSave = customTheme || branding.formTheme;
    const formKey = `google_form_theme_${formId}`;
    try {
      localStorage.setItem(formKey, JSON.stringify(themeToSave));
    } catch (e) {
      console.warn('Could not save form theme to localStorage:', e);
    }
  };

  const setInstitutionDetails = (name: string, sub: string) => {
    setBranding((prev) => ({
      ...prev,
      institutionName: name,
      subHeader: sub,
    }));
  };

  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
  };

  const currentTheme = THEME_PRESETS[branding.themeId] || THEME_PRESETS.amber;
  const formTheme = branding.formTheme || DEFAULT_FORM_THEME;

  return (
    <ThemeContext.Provider
      value={{
        branding,
        currentTheme,
        formTheme,
        setTheme,
        setLogo,
        updateFormTheme,
        loadPropertiesFromGoogleForm,
        saveFormThemeForId,
        setInstitutionDetails,
        resetBranding,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
