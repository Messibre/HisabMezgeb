import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { renderDocumentToPdf } from '../../src/services/export/pdfRenderer.js';
import { renderDocumentToDocx } from '../../src/services/export/docxRenderer.js';
import { buildStatementDocumentModel } from '../../src/services/export/statementDocument.js';
import { buildReportDocumentModel } from '../../src/services/export/reportDocument.js';

describe('Export Renderers (PDF and DOCX)', () => {
  const amharicCustomerName = 'አበበ ተሰማ "ፈጣን"';
  const tigrignaCustomerName = 'ተኽለ ሓጎስ';

  const sampleStatementData = {
    shopName: 'ሱቅ መርካቶ',
    customerName: amharicCustomerName,
    balance: 550,
    history: [
      {
        id: '1',
        kind: 'borrow' as const,
        date: new Date('2026-10-01'),
        amount: 800,
        itemsDescription: 'ዘይት እና ዱቄት',
      },
      {
        id: '2',
        kind: 'payment' as const,
        date: new Date('2026-10-15'),
        amount: 250,
        itemsDescription: null,
      },
    ],
  };

  const sampleReportData = {
    shopName: 'ድኳን ተስፋይ',
    from: new Date('2026-10-01'),
    to: new Date('2026-10-31'),
    summary: {
      totalIncome: 45000,
      totalBusinessExpenses: 12000,
      totalPersonalDraws: 5000,
      totalFundingIn: 10000,
      totalFundingOut: 2000,
      totalOwedByCustomers: 6500,
    },
    expenseBreakdown: [
      { categoryId: '1', categoryName: 'ክራይ', group: 'business', total: 10000 },
      { categoryId: '2', categoryName: 'መጓዓዝያ', group: 'business', total: 2000 },
    ],
  };

  describe('PDF Renderer', () => {
    it('produces valid PDF starting with %PDF and embeds the NotoSansEthiopic font', async () => {
      const model = buildStatementDocumentModel(sampleStatementData, { lang: 'am', format: 'pdf' });
      const buffer = await renderDocumentToPdf(model);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);

      // 1. Starts with %PDF
      const header = buffer.subarray(0, 4).toString();
      expect(header).toBe('%PDF');

      // 2. Contains embedded font reference (NotoSansEthiopic)
      const binaryStr = buffer.toString('latin1');
      expect(binaryStr).toContain('NotoSansEthiopic');
    });

    it('renders a Tigrigna report to PDF without error', async () => {
      const model = buildReportDocumentModel(sampleReportData, { lang: 'ti', format: 'pdf' });
      const buffer = await renderDocumentToPdf(model);

      expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  describe('DOCX Renderer', () => {
    it('produces a valid zip archive whose word/document.xml contains the customer name', async () => {
      const model = buildStatementDocumentModel(sampleStatementData, { lang: 'am', format: 'docx' });
      const buffer = await renderDocumentToDocx(model);

      expect(Buffer.isBuffer(buffer)).toBe(true);

      // 1. Starts with PK (ZIP magic number)
      expect(buffer.subarray(0, 2).toString()).toBe('PK');

      // 2. Load zip and inspect word/document.xml
      const zip = await JSZip.loadAsync(buffer);
      const documentXmlFile = zip.file('word/document.xml');
      const documentXml = await documentXmlFile!.async('text');
      // Must contain the Amharic customer name (quotes may be xml encoded as &quot;)
      expect(documentXml).toContain('አበበ ተሰማ');
      expect(documentXml).toContain('ፈጣን');
      // Must contain the description
      expect(documentXml).toContain('ዘይት እና ዱቄት');
    });

    it('produces valid DOCX for report in Tigrigna', async () => {
      const model = buildReportDocumentModel(sampleReportData, { lang: 'ti', format: 'docx' });
      const buffer = await renderDocumentToDocx(model);

      expect(buffer.subarray(0, 2).toString()).toBe('PK');

      const zip = await JSZip.loadAsync(buffer);
      const documentXml = await zip.file('word/document.xml')!.async('text');
      expect(documentXml).toContain('ድኳን ተስፋይ');
      expect(documentXml).toContain('ክራይ');
    });
  });
});
