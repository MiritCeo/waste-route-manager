const normalizeText = (value?: string): string => {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/[,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const capitalize = (value: string) => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const normalizeCityName = (value: string): string => {
  if (!value) return '';
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(part =>
      part
        .split('-')
        .filter(Boolean)
        .map(segment => capitalize(segment))
        .join('-')
    )
    .join(' ');
};

export const buildAddressKey = (params: {
  street: string;
  number: string;
  city: string;
  postalCode?: string;
}): string => {
  const { street, number, city, postalCode } = params;
  return [
    normalizeText(street),
    normalizeText(number),
    normalizeText(city),
    normalizeText(postalCode),
  ].join('|');
};

export const formatAddressLabel = (params: {
  street: string;
  number: string;
  city: string;
  postalCode?: string;
}): string => {
  const { street, number, city, postalCode } = params;
  const postalPart = postalCode ? `${postalCode} ` : '';
  return `${postalPart}${city}, ${street} ${number}`.trim();
};
