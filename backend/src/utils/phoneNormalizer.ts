export const normalizePhone = (phone: string): string => {
  let normalized = phone.replace(/[^\d+]/g, '');

  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.slice(2);
  }

  if (normalized.startsWith('0')) {
    normalized = '+251' + normalized.slice(1);
  }

  if (normalized.startsWith('251') && !normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  if (!normalized.startsWith('+') || normalized.length < 12) {
    throw new Error('Invalid phone number format');
  }

  return normalized;
};
