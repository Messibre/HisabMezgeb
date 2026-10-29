import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildReportDocumentModel } from '../src/services/export/reportDocument.js';
import { buildStatementDocumentModel } from '../src/services/export/statementDocument.js';
import { renderDocumentToPdf } from '../src/services/export/pdfRenderer.js';
import { renderDocumentToDocx } from '../src/services/export/docxRenderer.js';
import type { SupportedLang } from '../src/services/export/documentModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const outputDir = path.resolve(__dirname, '../samples');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const languages: SupportedLang[] = ['en', 'am', 'ti'];

  // 1. Month Report Sample Data
  const sampleReportData = {
    shopName: 'ተስፋ የሸቀጣ ሸቀጥ ሱቅ (Tesfa Shop)',
    from: new Date('2026-10-01T00:00:00Z'),
    to: new Date('2026-10-31T23:59:59Z'),
    generatedAt: new Date('2026-10-29T10:00:00Z'),
    summary: {
      totalIncome: 145800.5,
      totalBusinessExpenses: 68450.0,
      totalPersonalDraws: 18200.0,
      totalFundingIn: 25000.0,
      totalFundingOut: 10000.0,
      totalOwedByCustomers: 34500.75,
    },
    debtsPeriod: {
      totalNewlyBorrowed: 21500.0,
      totalRepaidInPeriod: 16200.0,
    },
    expenseBreakdown: [
      {
        categoryId: 'cat-1',
        categoryName: 'የእህል እና ስኳር ግዢ (Grain & Sugar Purchase)',
        group: 'business',
        total: 48500.0,
      },
      {
        categoryId: 'cat-2',
        categoryName: 'የሱቅ ኪራይ (Shop Rent)',
        group: 'business',
        total: 15000.0,
      },
      {
        categoryId: 'cat-3',
        categoryName: 'መብራት እና ውሃ (Utilities)',
        group: 'business',
        total: 4950.0,
      },
      {
        categoryId: 'cat-4',
        categoryName: 'የትምህርት ቤት ክፍያ (School Fees)',
        group: 'personal',
        total: 12000.0,
      },
      {
        categoryId: 'cat-5',
        categoryName: 'የቤት ወጪ (Family Household)',
        group: 'personal',
        total: 6200.0,
      },
    ],
  };

  // 2. Customer Statement Sample Data
  const sampleStatementData = {
    shopName: 'ተስፋ የሸቀጣ ሸቀጥ ሱቅ (Tesfa Shop)',
    customerName: 'ዮናስ ሃይለማሪያም (Yonas Hailemariam)',
    balance: 4250.0,
    statementDate: new Date('2026-10-29T10:00:00Z'),
    history: [
      {
        id: 'h-1',
        kind: 'borrow' as const,
        date: new Date('2026-10-02T09:00:00Z'),
        amount: 3500.0,
        itemsDescription: '2 ጆንያ ዱቄት እና 5 ሊትር ዘይት (2 flour bags, 5L oil)',
      },
      {
        id: 'h-2',
        kind: 'payment' as const,
        date: new Date('2026-10-10T14:30:00Z'),
        amount: 2000.0,
        itemsDescription: 'በከፊል የተከፈለ በባንክ (Partial payment via bank transfer)',
      },
      {
        id: 'h-3',
        kind: 'borrow' as const,
        date: new Date('2026-10-16T11:15:00Z'),
        amount: 4750.0,
        itemsDescription: 'ስኳር፣ ሳሙና እና ፓስታ (Sugar, soap & pasta packages)',
      },
      {
        id: 'h-4',
        kind: 'payment' as const,
        date: new Date('2026-10-24T16:00:00Z'),
        amount: 2000.0,
        itemsDescription: 'በጥሬ ገንዘብ የተከፈለ (Cash payment)',
      },
    ],
  };

  console.log(`Generating samples into ${outputDir}...`);

  for (const lang of languages) {
    // Report PDF
    const reportModelPdf = buildReportDocumentModel(sampleReportData, { lang, format: 'pdf' });
    const reportPdfBuf = await renderDocumentToPdf(reportModelPdf);
    const reportPdfPath = path.join(outputDir, `sample-month-report-${lang}.pdf`);
    fs.writeFileSync(reportPdfPath, reportPdfBuf);
    console.log(`✓ Wrote ${reportPdfPath} (${reportPdfBuf.length} bytes)`);

    // Report DOCX
    const reportModelDocx = buildReportDocumentModel(sampleReportData, { lang, format: 'docx' });
    const reportDocxBuf = await renderDocumentToDocx(reportModelDocx);
    const reportDocxPath = path.join(outputDir, `sample-month-report-${lang}.docx`);
    fs.writeFileSync(reportDocxPath, reportDocxBuf);
    console.log(`✓ Wrote ${reportDocxPath} (${reportDocxBuf.length} bytes)`);

    // Statement PDF
    const stmtModelPdf = buildStatementDocumentModel(sampleStatementData, { lang, format: 'pdf' });
    const stmtPdfBuf = await renderDocumentToPdf(stmtModelPdf);
    const stmtPdfPath = path.join(outputDir, `sample-customer-statement-${lang}.pdf`);
    fs.writeFileSync(stmtPdfPath, stmtPdfBuf);
    console.log(`✓ Wrote ${stmtPdfPath} (${stmtPdfBuf.length} bytes)`);

    // Statement DOCX
    const stmtModelDocx = buildStatementDocumentModel(sampleStatementData, { lang, format: 'docx' });
    const stmtDocxBuf = await renderDocumentToDocx(stmtModelDocx);
    const stmtDocxPath = path.join(outputDir, `sample-customer-statement-${lang}.docx`);
    fs.writeFileSync(stmtDocxPath, stmtDocxBuf);
    console.log(`✓ Wrote ${stmtDocxPath} (${stmtDocxBuf.length} bytes)`);
  }

  console.log('Sample generation completed successfully!');
}

main().catch((err) => {
  console.error('Error generating samples:', err);
  process.exit(1);
});
