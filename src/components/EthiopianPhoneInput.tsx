import type { ReactNode } from 'react';
import { TextInput } from '@mantine/core';
import {
  ETHIOPIAN_COUNTRY_CODE,
  normalizeEthiopianLocalPhone,
} from '../utils/ethiopianPhone';

interface EthiopianPhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: ReactNode;
  placeholder?: string;
}

export default function EthiopianPhoneInput({
  label,
  value,
  onChange,
  error,
  placeholder = '9-digit phone number',
}: EthiopianPhoneInputProps) {
  return (
    <TextInput
      label={label}
      error={error}
      leftSection={ETHIOPIAN_COUNTRY_CODE}
      leftSectionWidth={64}
      leftSectionPointerEvents="none"
      placeholder={placeholder}
      value={value}
      onChange={(event) =>
        onChange(normalizeEthiopianLocalPhone(event.currentTarget.value))
      }
      inputMode="numeric"
      maxLength={9}
      styles={{
        section: {
          fontWeight: 600,
          justifyContent: 'center',
          borderRight: '1px solid var(--mantine-color-gray-4)',
          color: 'var(--mantine-color-dark-6)',
        },
        input: {
          paddingLeft: 74,
        },
      }}
    />
  );
}
