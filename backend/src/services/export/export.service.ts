import { prisma } from '../../config/db.js';
import {
  buildSummary,
  buildDebtsPeriodReport,
  buildExpenseBreakdown,
  generateCsvExport,
} from '../reports.service.js';
import * as debtCustomerService from '../debtCustomer.service.js';
import { SupportedLang, ExportFormat, formatDateGregorian } from './documentModel.js';
import { buildReportDocumentModel } from './reportDocument.js';
import { buildStatementDocumentModel } from './statementDocument.js';
import { renderDocumentToPdf } from './pdfRenderer.js';
import { renderDocumentToDocx } from './docxRenderer.js';

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

/**
 * Sanitizes base name to be strictly ASCII safe (no quotes, newlines, slashes, etc.)
 */
export function buildSafeFilename(base: string, extension: string): string {
  const clean = base
    .replace(/[\r\n"';/\\]/g, '')
    .replace(/[^\w-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);

  const safe = clean || 'document';
  return `${safe}.${extension}`;
}

async function getAccountShopName(accountId: string): Promise<string | null> {
  try {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { shopName: true },
    });
    return account?.shopName ?? null;
  } catch {
    return null;
  }
}

/**
 * Export a period report as PDF, DOCX, or CSV.
 */
export async function exportReport(
  accountId: string,
  from: Date,
  to: Date,
  format: ExportFormat = 'pdf',
  lang: SupportedLang = 'en',
): Promise<ExportResult> {
  const fromStr = formatDateGregorian(from, 'en');
  const toStr = formatDateGregorian(to, 'en');
  const baseFilename = `hisab-report-${fromStr}_to_${toStr}`;

  if (format === 'csv') {
    const csvContent = await generateCsvExport(accountId, from, to);
    const filename = `${baseFilename}.csv`;
    return {
      buffer: Buffer.from(csvContent, 'utf-8'),
      filename,
      contentType: 'text/csv; charset=utf-8',
    };
  }

  const [shopName, summary, debtsPeriod, expenseBreakdown] = await Promise.all([
    getAccountShopName(accountId),
    buildSummary(accountId, from, to),
    buildDebtsPeriodReport(accountId, from, to),
    buildExpenseBreakdown(accountId, from, to),
  ]);

  const model = buildReportDocumentModel(
    {
      shopName,
      from,
      to,
      summary,
      debtsPeriod,
      expenseBreakdown,
    },
    { lang, format },
  );

  if (format === 'pdf') {
    const buffer = await renderDocumentToPdf(model);
    return {
      buffer,
      filename: `${baseFilename}.pdf`,
      contentType: 'application/pdf',
    };
  } else if (format === 'docx') {
    const buffer = await renderDocumentToDocx(model);
    return {
      buffer,
      filename: `${baseFilename}.docx`,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }

  throw new Error(`Unsupported export format: ${format}`);
}

/**
 * Export a customer statement as PDF or DOCX.
 */
export async function exportCustomerStatement(
  accountId: string,
  customerId: string,
  format: 'pdf' | 'docx' = 'pdf',
  lang: SupportedLang = 'en',
): Promise<ExportResult> {
  const [shopName, customerDetail] = await Promise.all([
    getAccountShopName(accountId),
    debtCustomerService.getCustomerWithHistory(accountId, customerId),
  ]);

  const dateStr = formatDateGregorian(new Date(), 'en');
  const filename = buildSafeFilename(`statement-${customerDetail.name}-${dateStr}`, format);

  const model = buildStatementDocumentModel(
    {
      shopName,
      customerName: customerDetail.name,
      balance: customerDetail.balance,
      history: customerDetail.history,
    },
    { lang, format },
  );

  if (format === 'pdf') {
    const buffer = await renderDocumentToPdf(model);
    return {
      buffer,
      filename,
      contentType: 'application/pdf',
    };
  } else if (format === 'docx') {
    const buffer = await renderDocumentToDocx(model);
    return {
      buffer,
      filename,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }

  throw new Error(`Unsupported statement export format: ${format}`);
}
