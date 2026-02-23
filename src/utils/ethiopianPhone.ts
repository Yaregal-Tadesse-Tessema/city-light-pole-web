export const ETHIOPIAN_COUNTRY_CODE = '+251';

export function normalizeEthiopianLocalPhone(value: string): string {
  return value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
}

export function isValidEthiopianLocalPhone(value: string): boolean {
  if (!value) return true;
  return /^[1-9]\d{8}$/.test(value);
}

export function toEthiopianInternationalPhone(value: string): string {
  const local = normalizeEthiopianLocalPhone(value);
  return local ? `${ETHIOPIAN_COUNTRY_CODE}${local}` : '';
}

export function fromStoredPhoneToLocal(value?: string | null): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');

  if (digits.startsWith('251')) {
    return digits.slice(3, 12);
  }

  return digits.slice(0, 9);
}
