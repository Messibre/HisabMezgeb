import {
  DocumentModel,
  SupportedLang,
  ExportFormat,
  I18N_STRINGS,
  formatMoney,
  formatDateGregorian,
  DocSection,
  DocTable,
} from './documentModel.js';

export interface ReportExpenseItem {
  categoryId: string;
  categoryName: string;
  group: string; // 'business' | 'personal'
  total: number;
}

export interface ReportDataInput {
  shopName: string | null;
  from: Date;
  to: Date;
  generatedAt?: Date;
  summary: {
    totalIncome: number;
    totalBusinessExpenses: number;
    totalPersonalDraws: number;
    totalFundingIn: number;
    totalFundingOut: number;
    totalOwedByCustomers: number;
  };
  debtsPeriod?: {
    totalNewlyBorrowed: number;
    totalRepaidInPeriod: number;
  };
  expenseBreakdown: ReportExpenseItem[];
}

export interface ReportDocOptions {
  lang?: SupportedLang;
  format?: ExportFormat;
}

/**
 * Pure function: constructs DocumentModel from report data without DB dependencies.
 */
export function buildReportDocumentModel(
  data: ReportDataInput,
  options: ReportDocOptions = {},
): DocumentModel {
  const lang = options.lang ?? 'en';
  const format = options.format ?? 'pdf';
  const t = I18N_STRINGS[lang] ?? I18N_STRINGS.en;

  const fromStr = formatDateGregorian(data.from, lang);
  const toStr = formatDateGregorian(data.to, lang);
  const generatedAt = data.generatedAt ?? new Date();
  const genDateStr = formatDateGregorian(generatedAt, lang);

  const sections: DocSection[] = [];

  // Section 1: Financial Summary
  sections.push({
    title: t.financialSummary,
    items: [
      {
        label: t.totalIncome,
        value: formatMoney(data.summary.totalIncome, lang),
        isBold: true,
      },
      {
        label: t.businessExpenses,
        value: formatMoney(data.summary.totalBusinessExpenses, lang),
      },
      {
        label: t.personalDraws,
        value: formatMoney(data.summary.totalPersonalDraws, lang),
      },
      {
        label: t.fundingIn,
        value: formatMoney(data.summary.totalFundingIn, lang),
      },
      {
        label: t.fundingOut,
        value: formatMoney(data.summary.totalFundingOut, lang),
      },
      {
        label: t.totalOwedToday,
        value: formatMoney(data.summary.totalOwedByCustomers, lang),
        isBold: true,
      },
    ],
    note: t.totalOwedNote,
  });

  // Section 2: Debt Activity during this period (if available)
  if (data.debtsPeriod) {
    sections.push({
      title: t.debtsSummary,
      items: [
        {
          label: t.newlyBorrowed,
          value: formatMoney(data.debtsPeriod.totalNewlyBorrowed, lang),
        },
        {
          label: t.repaid,
          value: formatMoney(data.debtsPeriod.totalRepaidInPeriod, lang),
        },
      ],
    });
  }

  // Section 3: Expense Breakdown by Category
  const activeExpenses = data.expenseBreakdown.filter((e) => e.total > 0);
  if (activeExpenses.length > 0) {
    const table: DocTable = {
      title: t.expensesByCategory,
      columns: [
        { header: t.category, align: 'left', widthRatio: 2 },
        { header: t.group, align: 'left', widthRatio: 1 },
        { header: t.amount, align: 'right', widthRatio: 1 },
      ],
      rows: activeExpenses.map((exp) => ({
        cells: [
          exp.categoryName,
          exp.group === 'business' ? t.businessExpenses : t.personalDraws,
          formatMoney(exp.total, lang),
        ],
      })),
    };

    sections.push({
      title: t.expensesByCategory,
      table,
    });
  } else {
    sections.push({
      title: t.expensesByCategory,
      items: [{ label: t.expensesByCategory, value: t.noExpenses }],
    });
  }

  const notes = [t.incomeNote];
  if (format === 'docx') {
    notes.push(t.wordFontNote);
  }

  return {
    docType: 'report',
    title: t.reportTitle,
    shopName: data.shopName,
    periodText: t.period(fromStr, toStr),
    generatedDateText: t.generatedOn(genDateStr),
    sections,
    notes,
    lang,
    format,
  };
}
