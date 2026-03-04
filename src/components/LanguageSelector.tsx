import { Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { AppLanguage } from '../i18n/index';
import { languageOptions, useLanguage } from '../i18n/useLanguage';

interface LanguageSelectorProps {
  compact?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function LanguageSelector({ compact = false, size = 'sm' }: LanguageSelectorProps) {
  const { t } = useTranslation('layout');
  const { language, setLanguage } = useLanguage();

  return (
    <Select
      data={languageOptions}
      value={language}
      onChange={(value) => {
        if (value) {
          setLanguage(value as AppLanguage);
        }
      }}
      size={size}
      label={compact ? undefined : t('languageSelectorLabel')}
      aria-label={t('languageSelectorLabel')}
      style={{ minWidth: compact ? 120 : 180 }}
    />
  );
}
