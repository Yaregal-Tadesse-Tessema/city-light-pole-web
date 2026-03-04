import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './resources/en';
import om from './resources/om';
import am from './resources/am';

export type AppLanguage = 'en' | 'om' | 'am';
export const supportedLanguages: AppLanguage[] = ['en', 'om', 'am'];
export const defaultLanguage: AppLanguage = 'en';

const resources = {
  en,
  om,
  am,
};

let initialLanguage: AppLanguage = defaultLanguage;
if (typeof window !== 'undefined') {
  const stored = window.localStorage.getItem('app_language');
  if (stored && supportedLanguages.includes(stored as AppLanguage)) {
    initialLanguage = stored as AppLanguage;
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: defaultLanguage,
  defaultNS: 'common',
  ns: ['common', 'layout', 'landing', 'login', 'auth', 'dashboard', 'reportAccident'],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
