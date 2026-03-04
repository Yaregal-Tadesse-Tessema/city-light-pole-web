import { useCallback, useEffect, useMemo, useState } from 'react';
import i18n, { AppLanguage, defaultLanguage, supportedLanguages } from './index';

const STORAGE_KEY = 'app_language';

const languageLabels: Record<AppLanguage, string> = {
  en: 'English',
  om: 'Afaan Oromoo',
  am: '????',
};

export const languageOptions = ((): { value: AppLanguage; label: string }[] =>
  supportedLanguages.map((value) => ({ value, label: languageLabels[value] }))
)();

export function useLanguage() {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    if (typeof window === 'undefined') {
      return defaultLanguage;
    }

    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (storedLanguage && supportedLanguages.includes(storedLanguage as AppLanguage)) {
      return storedLanguage as AppLanguage;
    }

    return defaultLanguage;
  });

  useEffect(() => {
    const current = i18n.language as AppLanguage;
    if (current && current !== language && supportedLanguages.includes(current)) {
      setLanguage(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLanguageFromUi = useCallback((newLanguage: AppLanguage) => {
    i18n.changeLanguage(newLanguage);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, newLanguage);
    }
    setLanguage(newLanguage);
  }, []);

  return useMemo(
    () => ({
      language,
      setLanguage: setLanguageFromUi,
      options: languageOptions,
    }),
    [language, setLanguageFromUi],
  );
}
