import { describe, it, expect } from 'vitest';
import { buildReportDocumentModel } from '../../src/services/export/reportDocument.js';
import { buildStatementDocumentModel } from '../../src/services/export/statementDocument.js';
import { displayCategoryName, type SupportedLang, type DocumentModel } from '../../src/services/export/documentModel.js';

/** Every visible string of a document model. */
const textOf = (model: DocumentModel): string[] => [
  model.title,
  model.periodText ?? '',
  model.generatedDateText,
  model.currentBalanceText ?? '',
  model.closingLine ?? '',
  ...(model.notes ?? []),
  ...model.sections.flatMap((s) => [
    s.title,
    s.note ?? '',
    ...(s.items ?? []).flatMap((i) => [i.label, i.value]),
    ...(s.table ? [s.table.title ?? '', ...s.table.columns.map((c) => c.header), ...s.table.rows.flatMap((r) => r.cells)] : []),
  ]),
];

// Latin words other than the allowed technical tokens (dates and numbers are digits).
const latinWords = (texts: string[]) =>
  texts.join(' ').match(/[A-Za-z]{2,}/g)?.filter((w) => !['Word'].includes(w)) ?? [];

const reportInput = {
  shopName: 'አበበ ሱቅ',
  from: new Date('2026-11-01'),
  to: new Date('2026-11-14'),
  generatedAt: new Date('2026-11-14'),
  summary: {
    totalIncome: 13230,
    totalBusinessExpenses: 2700,
    totalPersonalDraws: 1107,
    totalFundingIn: 22120,
    totalFundingOut: 0,
    totalOwedByCustomers: 20522,
  },
  debtsPeriod: { totalNewlyBorrowed: 2000, totalRepaidInPeriod: 500 },
  expenseBreakdown: [
    { categoryId: 'c1', categoryName: 'Cost of Goods', group: 'business' as const, total: 2700 },
    { categoryId: 'c2', categoryName: 'Debt payment', group: 'personal' as const, total: 987 },
    { categoryId: 'c3', categoryName: 'Home Necessities', group: 'personal' as const, total: 120 },
    { categoryId: 'c4', categoryName: 'Equb', group: 'business' as const, total: 50 },
  ],
};

describe('export language', () => {
  it.each(['am', 'ti'] as SupportedLang[])('a %s report has no English words', (lang) => {
    const model = buildReportDocumentModel(reportInput, { lang });
    expect(latinWords(textOf(model))).toEqual([]);
  });

  it.each(['am', 'ti'] as SupportedLang[])('a %s customer statement has no English words', (lang) => {
    const model = buildStatementDocumentModel(
      {
        shopName: 'አበበ ሱቅ',
        customerName: 'ሰሚራ',
        statementDate: new Date('2026-11-14'),
        balance: 1500,
        history: [
          { id: 'b1', kind: 'borrow', date: new Date('2026-11-01'), amount: 2000, itemsDescription: 'ዘይት' },
          { id: 'p1', kind: 'payment', date: new Date('2026-11-10'), amount: 500, itemsDescription: null },
        ],
      },
      { lang },
    );
    expect(latinWords(textOf(model))).toEqual([]);
  });

  it('shows seeded categories in the document language and keeps user-made names', () => {
    expect(displayCategoryName('Equb', 'am')).toBe('ዕቁብ');
    expect(displayCategoryName('Cost of Goods', 'en')).toBe('Cost of Goods');
    expect(displayCategoryName('ክራይ', 'am')).toBe('ክራይ');
    expect(displayCategoryName('My own category', 'am')).toBe('My own category');
  });
});
