import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractFilenameFromHeader(header?: string, fallback = 'download'): string {
  if (!header) return fallback;

  // RFC 5987 / UTF-8 format: filename*=UTF-8''...
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      // fallback to standard match
    }
  }

  // Standard format: filename="xyz" or filename=xyz
  const match = header.match(/filename="?([^";]+)"?/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  return fallback;
}
