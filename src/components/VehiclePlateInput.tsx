import type { ReactNode } from 'react';
import { Group, Input, Select, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';

interface VehiclePlateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: ReactNode;
  placeholder?: string;
}

const CODE_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
];

const REGION_OPTIONS = [
  { value: 'AA', label: 'AA' },
  { value: 'DD', label: 'DD' },
  { value: 'OR', label: 'OR' },
  { value: 'AM', label: 'AM' },
  { value: 'TI', label: 'TI' },
  { value: 'AF', label: 'AF' },
  { value: 'SO', label: 'SO' },
  { value: 'BE', label: 'BE' },
  { value: 'GA', label: 'GA' },
  { value: 'HA', label: 'HA' },
  { value: 'SI', label: 'SI' },
  { value: 'SW', label: 'SW' },
  { value: 'CE', label: 'CE' },
  { value: 'ET', label: 'ET' },
];

function parseVehiclePlate(value: string): {
  code: string | null;
  region: string | null;
  plate: string;
} {
  if (!value) {
    return { code: null, region: null, plate: '' };
  }

  let remaining = value.trim();
  let code: string | null = null;
  let region: string | null = null;

  const codeMatch = remaining.match(/^Code\s+([1-6])\s*/i);
  if (codeMatch) {
    code = codeMatch[1];
    remaining = remaining.slice(codeMatch[0].length).trim();
  }

  const regionMatch = remaining.match(/^(AA|DD|OR|AM|TI|AF|SO|BE|GA|HA|SI|SW|CE|ET)\b\s*/i);
  if (regionMatch) {
    region = regionMatch[1].toUpperCase();
    remaining = remaining.slice(regionMatch[0].length).trim();
  }

  return { code, region, plate: remaining };
}

function composeVehiclePlate(code: string | null, region: string | null, plate: string): string {
  const parts: string[] = [];

  if (code) parts.push(`Code ${code}`);
  if (region) parts.push(region);
  if (plate.trim()) parts.push(plate.trim());

  return parts.join(' ').trim();
}

export default function VehiclePlateInput({
  label,
  value,
  onChange,
  error,
  placeholder,
}: VehiclePlateInputProps) {
  const { t } = useTranslation('vehiclePlateInput');
  const { code, region, plate } = parseVehiclePlate(value || '');
  const resolvedPlaceholder = placeholder ?? t('placeholders.plate');

  return (
    <Input.Wrapper label={label} error={error}>
      <Group gap={0} wrap="nowrap">
        <Select
          placeholder={t('placeholders.code')}
          data={CODE_OPTIONS}
          value={code}
          onChange={(nextCode) =>
            onChange(composeVehiclePlate(nextCode || null, region, plate))
          }
          allowDeselect
          clearable
          w={84}
          styles={{
            input: {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRight: 'none',
              fontWeight: 600,
              textAlign: 'center',
            },
          }}
        />
        <Select
          placeholder={t('placeholders.region')}
          data={REGION_OPTIONS}
          searchable
          value={region}
          onChange={(nextRegion) =>
            onChange(composeVehiclePlate(code, nextRegion || null, plate))
          }
          allowDeselect
          clearable
          w={88}
          styles={{
            input: {
              borderRadius: 0,
              borderRight: 'none',
            },
          }}
        />
        <TextInput
          value={plate}
          onChange={(event) =>
            onChange(composeVehiclePlate(code, region, event.currentTarget.value))
          }
          placeholder={resolvedPlaceholder}
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
