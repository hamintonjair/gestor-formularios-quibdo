export type ThemeId = 'emerald' | 'blue' | 'purple' | 'amber' | 'slate';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  primaryColor: string;
  primaryHex: string;
  headerGradient: string;
  badgeStyle: string;
  buttonPrimary: string;
  buttonHover: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

export interface GoogleFormThemeProperties {
  // Estilo del texto
  headerFont: string;
  headerFontSize: number;
  questionFont: string;
  questionFontSize: number;
  textFont: string;
  textFontSize: number;

  // Encabezado
  headerImageUrl: string | null;
  headerImageName?: string;

  // Color del tema y fondo
  themeColor: string;
  backgroundColor: string;
}

export interface BrandingConfig {
  institutionName: string;
  subHeader: string;
  logoUrl: string | null;
  logoType: 'custom' | 'default';
  themeId: ThemeId;
  formTheme: GoogleFormThemeProperties;
}

export const GOOGLE_FORMS_PALETTE = [
  { name: 'Rojo', hex: '#db4437' },
  { name: 'Púrpura Google', hex: '#673ab7' },
  { name: 'Índigo', hex: '#3f51b5' },
  { name: 'Azul', hex: '#4285f4' },
  { name: 'Celeste / Cian', hex: '#00bcd4' },
  { name: 'Verde Azulado / Teal', hex: '#009688' },
  { name: 'Naranja', hex: '#ff5722' },
  { name: 'Ámbar / Dorado', hex: '#ff9800' },
  { name: 'Verde', hex: '#4caf50' },
  { name: 'Gris Azulado', hex: '#607d8b' },
  { name: 'Gris Neutro', hex: '#9e9e9e' },
];

export const FONT_OPTIONS = [
  'Roboto',
  'Montserrat',
  'Open Sans',
  'Playfair Display',
  'Poppins',
  'Arial',
  'Merriweather',
  'Lato',
];

export const DEFAULT_FORM_THEME: GoogleFormThemeProperties = {
  headerFont: 'Roboto',
  headerFontSize: 24,
  questionFont: 'Roboto',
  questionFontSize: 12,
  textFont: 'Roboto',
  textFontSize: 11,
  headerImageUrl: null,
  themeColor: '#ff9800', // Ámbar Chocoano as in screenshot
  backgroundColor: '#fff8e1',
};

export const THEME_PRESETS: Record<ThemeId, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Chocó Esmeralda (Institucional)',
    description: 'Tonos verdes y turquesa inspirados en la riqueza natural del Chocó',
    primaryColor: 'teal',
    primaryHex: '#009688',
    headerGradient: 'from-teal-800 via-teal-700 to-emerald-700',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    buttonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white',
    buttonHover: 'hover:bg-teal-50 text-teal-700',
    accentBg: 'bg-teal-50',
    accentBorder: 'border-teal-200',
    accentText: 'text-teal-700',
  },
  blue: {
    id: 'blue',
    name: 'Azul Pacífico (Alcaldía)',
    description: 'Azul cívico institucional sobrio y confiable',
    primaryColor: 'blue',
    primaryHex: '#4285f4',
    headerGradient: 'from-blue-900 via-blue-800 to-sky-700',
    badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200',
    buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonHover: 'hover:bg-blue-50 text-blue-700',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    accentText: 'text-blue-700',
  },
  purple: {
    id: 'purple',
    name: 'Púrpura Inclusión Social',
    description: 'Enfoque en cohesión, equidad y programas de inclusión',
    primaryColor: 'purple',
    primaryHex: '#673ab7',
    headerGradient: 'from-indigo-900 via-purple-800 to-violet-700',
    badgeStyle: 'bg-purple-50 text-purple-800 border-purple-200',
    buttonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white',
    buttonHover: 'hover:bg-purple-50 text-purple-700',
    accentBg: 'bg-purple-50',
    accentBorder: 'border-purple-200',
    accentText: 'text-purple-700',
  },
  amber: {
    id: 'amber',
    name: 'Cálido Chocoano / Terracota',
    description: 'Colores cálidos, dorados y tierra de la región',
    primaryColor: 'amber',
    primaryHex: '#ff9800',
    headerGradient: 'from-amber-900 via-orange-800 to-amber-700',
    badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
    buttonPrimary: 'bg-amber-600 hover:bg-amber-700 text-white',
    buttonHover: 'hover:bg-amber-50 text-amber-700',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    accentText: 'text-amber-800',
  },
  slate: {
    id: 'slate',
    name: 'Grafito Ejecutivo',
    description: 'Diseño minimalista en tonos carbón y pizarra de alta precisión',
    primaryColor: 'slate',
    primaryHex: '#607d8b',
    headerGradient: 'from-slate-900 via-slate-800 to-zinc-700',
    badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300',
    buttonPrimary: 'bg-slate-800 hover:bg-slate-900 text-white',
    buttonHover: 'hover:bg-slate-100 text-slate-800',
    accentBg: 'bg-slate-100',
    accentBorder: 'border-slate-300',
    accentText: 'text-slate-800',
  },
};
