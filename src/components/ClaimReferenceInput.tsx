import type { ReactNode } from 'react';
import { Group, Input, Select, TextInput } from '@mantine/core';

interface ClaimReferenceInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: ReactNode;
  placeholder?: string;
}

const CODE_OPTIONS = [
  { value: '1', label: 'Code 1' },
  { value: '2', label: 'Code 2' },
  { value: '3', label: 'Code 3' },
  { value: '4', label: 'Code 4' },
  { value: '5', label: 'Code 5' },
  { value: '6', label: 'Code 6' },
];

function splitClaimReference(value: string): { code: string; reference: string } {
  const match = value.match(/^([1-6])\s+Code\s*(.*)$/i);
  if (match) {
    return {
      code: match[1],
      reference: match[2].trim(),
    };
  }

  return {
    code: '1',
    reference: value || '',
  };
}

function composeClaimReference(code: string, reference: string): string {
  if (!reference.trim()) return `${code} Code`;
  return `${code} Code ${reference.trim()}`;
}

export default function ClaimReferenceInput({
  label,
  value,
  onChange,
  error,
  placeholder = 'Enter reference number',
}: ClaimReferenceInputProps) {
  const { code, reference } = splitClaimReference(value || '');

  return (
    <Input.Wrapper label={label} error={error}>
      <Group gap={0} wrap="nowrap">
        <Select
          data={CODE_OPTIONS}
          value={code}
          onChange={(nextCode) => onChange(composeClaimReference(nextCode || '1', reference))}
          allowDeselect={false}
          w={120}
          styles={{
            input: {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRight: 'none',
              fontWeight: 600,
            },
          }}
        />
        <TextInput
          value={reference}
          onChange={(event) => onChange(composeClaimReference(code, event.currentTarget.value))}
          placeholder={placeholder}
          style={{ flex: 1 }}
          styles={{
            input: {
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            },
          }}
        />
      </Group>
    </Input.Wrapper>
  );
}
