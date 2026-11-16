import type { TFunction } from 'i18next';

/**
 * Categories created at registration are stored with their English name. Until the
 * backend has a systemKey column (migration held), an exact match on the seeded
 * name identifies them. A category the user created or renamed shows its own name.
 * Keep in sync with SYSTEM_CATEGORY_NAMES in backend/src/services/export/documentModel.ts.
 */
const SYSTEM_CATEGORIES: Record<string, string> = {
  'Cost of Goods': 'costOfGoods',
  Equb: 'equb',
  'Home Necessities': 'homeNecessities',
  'Debt payment': 'debtPayment',
};

export function categoryLabel(name: string, t: TFunction): string {
  const key = SYSTEM_CATEGORIES[name];
  return key ? t(`categories.${key}`) : name;
}

const FUNDING_TYPE_KEYS: Record<string, string> = {
  salary_injection: 'entries.salaryIn',
  borrowed_in: 'entries.borrowedIn',
  borrowed_repaid: 'entries.borrowedRepaid',
};

export function fundingTypeLabel(type: string, t: TFunction): string {
  const key = FUNDING_TYPE_KEYS[type];
  return key ? t(key) : type;
}
