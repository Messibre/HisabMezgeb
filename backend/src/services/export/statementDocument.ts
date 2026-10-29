import {
  DocumentModel,
  SupportedLang,
  ExportFormat,
  I18N_STRINGS,
  formatMoney,
  formatDateGregorian,
  DocTable,
  DocSection,
} from './documentModel.js';

export interface StatementHistoryItem {
  id: string;
  kind: 'borrow' | 'payment';
  date: Date;
  amount: number;
  itemsDescription: string | null;
}

export interface StatementDataInput {
  shopName: string | null;
  customerName: string;
  balance: number; // Must come from calculateCustomerBalance()
  history: StatementHistoryItem[]; // Oldest to newest
  statementDate?: Date;
}

export interface StatementDocOptions {
  lang?: SupportedLang;
  format?: ExportFormat;
}

/**
 * Pure function: constructs DocumentModel for customer statement.
 */
export function buildStatementDocumentModel(
  data: StatementDataInput,
  options: StatementDocOptions = {},
): DocumentModel {
  const lang = options.lang ?? 'en';
  const format = options.format ?? 'pdf';
  const t = I18N_STRINGS[lang] ?? I18N_STRINGS.en;

  const stmtDate = data.statementDate ?? new Date();
  const dateStr = formatDateGregorian(stmtDate, lang);

  // Compute running balance table (oldest to newest)
  // Use exact cent integer math to avoid any floating-point arithmetic errors.
  let runningCents = 0;
  const tableRows = data.history.map((event) => {
    const amountCents = Math.round(event.amount * 100);
    const isBorrow = event.kind === 'borrow';

    if (isBorrow) {
      runningCents += amountCents;
    } else {
      runningCents = Math.max(0, runningCents - amountCents);
    }

    const eventDateStr = formatDateGregorian(event.date, lang);
    const kindLabel = isBorrow ? t.borrowKind : t.paymentKind;
    const desc = event.itemsDescription ? `${kindLabel}: ${event.itemsDescription}` : kindLabel;
    const borrowedStr = isBorrow ? formatMoney(event.amount, lang) : '-';
    const paidStr = !isBorrow ? formatMoney(event.amount, lang) : '-';
    const runningBalStr = formatMoney(runningCents / 100, lang);

    return {
      cells: [eventDateStr, desc, borrowedStr, paidStr, runningBalStr],
    };
  });

  const table: DocTable = {
    columns: [
      { header: t.date, align: 'left', widthRatio: 1.2 },
      { header: t.typeOrDescription, align: 'left', widthRatio: 2.2 },
      { header: t.borrowed, align: 'right', widthRatio: 1.2 },
      { header: t.paid, align: 'right', widthRatio: 1.2 },
      { header: t.runningBalance, align: 'right', widthRatio: 1.2 },
    ],
    rows: tableRows,
  };

  const sections: DocSection[] = [
    {
      title: t.statementTitle,
      table,
    },
  ];

  const notes: string[] = [];
  if (format === 'docx') {
    notes.push(t.wordFontNote);
  }

  const closingLine = data.balance <= 0 ? t.closingLineZero : t.closingLinePositive;

  return {
    docType: 'statement',
    title: t.statementTitle,
    shopName: data.shopName,
    entityName: data.customerName,
    generatedDateText: t.generatedOn(dateStr),
    currentBalanceText: t.currentBalance(formatMoney(data.balance, lang)),
    sections,
    notes,
    closingLine,
    lang,
    format,
  };
}
