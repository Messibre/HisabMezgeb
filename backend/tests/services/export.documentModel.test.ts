import { describe, it, expect } from 'vitest';
import {
  buildReportDocumentModel,
  ReportDataInput,
} from '../../src/services/export/reportDocument.js';
import {
  buildStatementDocumentModel,
  StatementDataInput,
} from '../../src/services/export/statementDocument.js';
import {
  formatMoney,
  formatDateGregorian,
  SupportedLang,
} from '../../src/services/export/documentModel.js';

describe('Document Model Builders (Pure, Table-Driven)', () => {
  describe('formatMoney and formatDateGregorian', () => {
    it('formats money consistently with 2 decimal places and thousands separators', () => {
      expect(formatMoney(0)).toBe('ETB 0.00');
      expect(formatMoney(1234.5)).toBe('ETB 1,234.50');
      expect(formatMoney(999999.99)).toBe('ETB 999,999.99');
      // Decimal precision
      expect(formatMoney(10.005)).toBe('ETB 10.01');
    });

    it('formats Gregorian date as YYYY-MM-DD', () => {
      expect(formatDateGregorian(new Date('2026-10-29T12:00:00Z'))).toBe('2026-10-29');
      expect(formatDateGregorian(new Date('2026-01-05T00:00:00Z'))).toBe('2026-01-05');
    });
  });

  describe('buildReportDocumentModel', () => {
    const tableCases: {
      name: string;
      data: ReportDataInput;
      lang: SupportedLang;
      expectedChecks: (model: any) => void;
    }[] = [
      {
        name: 'Case 1: Empty period with zero totals',
        data: {
          shopName: null,
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
          generatedAt: new Date('2026-02-01'),
          summary: {
            totalIncome: 0,
            totalBusinessExpenses: 0,
            totalPersonalDraws: 0,
            totalFundingIn: 0,
            totalFundingOut: 0,
            totalOwedByCustomers: 0,
          },
          expenseBreakdown: [],
        },
        lang: 'en',
        expectedChecks: (model) => {
          expect(model.docType).toBe('report');
          expect(model.title).toBe('Financial Report');
          expect(model.shopName).toBeNull();
          expect(model.periodText).toBe('Period: 2026-01-01 to 2026-01-31');
          expect(model.sections[0].items[0].value).toBe('ETB 0.00');
          // Notes
          expect(model.notes).toContain('Income includes cash from customer payments.');
        },
      },
      {
        name: 'Case 2: One-day period in Amharic with shop name',
        data: {
          shopName: 'አበበ ሱቅ',
          from: new Date('2026-10-15'),
          to: new Date('2026-10-15'),
          generatedAt: new Date('2026-10-15'),
          summary: {
            totalIncome: 12500,
            totalBusinessExpenses: 3000,
            totalPersonalDraws: 1500,
            totalFundingIn: 5000,
            totalFundingOut: 2000,
            totalOwedByCustomers: 8400,
          },
          debtsPeriod: {
            totalNewlyBorrowed: 2000,
            totalRepaidInPeriod: 1000,
          },
          expenseBreakdown: [
            { categoryId: 'c1', categoryName: 'ዕቃ ግዢ', group: 'business', total: 3000 },
          ],
        },
        lang: 'am',
        expectedChecks: (model) => {
          expect(model.title).toBe('የፋይናንስ ሪፖርት');
          expect(model.shopName).toBe('አበበ ሱቅ');
          expect(model.periodText).toBe('ጊዜ፡ ከ 2026-10-15 እስከ 2026-10-15');
          expect(model.sections[0].items[0].value).toBe('ETB 12,500.00');
          expect(model.sections[1].title).toBe('የዕዳ እንቅስቃሴ (በዚህ ጊዜ)');
          expect(model.sections[2].table?.rows[0].cells[0]).toBe('ዕቃ ግዢ');
          expect(model.notes).toContain(
            'ጠቅላላ ገቢ ከደንበኞች ዕዳ ክፍያ የተሰበሰበውን ጥሬ ገንዘብ ያካትታል።',
          );
        },
      },
      {
        name: 'Case 3: Many expense categories in Tigrigna',
        data: {
          shopName: 'ድኳን ተስፋይ',
          from: new Date('2026-01-01'),
          to: new Date('2026-06-30'),
          generatedAt: new Date('2026-07-01'),
          summary: {
            totalIncome: 100000,
            totalBusinessExpenses: 45000,
            totalPersonalDraws: 20000,
            totalFundingIn: 0,
            totalFundingOut: 0,
            totalOwedByCustomers: 12000,
          },
          expenseBreakdown: [
            { categoryId: '1', categoryName: 'ክራይ', group: 'business', total: 15000 },
            { categoryId: '2', categoryName: 'መብራህቲ', group: 'business', total: 5000 },
            { categoryId: '3', categoryName: 'መጓዓዝያ', group: 'business', total: 25000 },
            { categoryId: '4', categoryName: 'ቀለብ ስድራ', group: 'personal', total: 20000 },
            { categoryId: '5', categoryName: 'ዘይተጠቕመ', group: 'business', total: 0 }, // Should be excluded from table
          ],
        },
        lang: 'ti',
        expectedChecks: (model) => {
          expect(model.title).toBe('ናይ ፋይናንስ ጸብጻብ');
          expect(model.shopName).toBe('ድኳን ተስፋይ');
          const expSection = model.sections.find((s: any) => s.table !== undefined);
          expect(expSection).toBeDefined();
          // Zero category excluded
          expect(expSection.table.rows).toHaveLength(4);
          expect(expSection.table.rows[0].cells[0]).toBe('ክራይ');
        },
      },
    ];

    for (const testCase of tableCases) {
      it(testCase.name, () => {
        const model = buildReportDocumentModel(testCase.data, { lang: testCase.lang });
        testCase.expectedChecks(model);
      });
    }
  });

  describe('buildStatementDocumentModel', () => {
    const tableCases: {
      name: string;
      data: StatementDataInput;
      lang: SupportedLang;
      expectedChecks: (model: any) => void;
    }[] = [
      {
        name: 'Customer with zero balance (closingLineZero)',
        data: {
          shopName: 'Mekelle Market',
          customerName: 'Almaz Gebre',
          balance: 0,
          history: [
            {
              id: '1',
              kind: 'borrow',
              date: new Date('2026-05-01'),
              amount: 500,
              itemsDescription: 'Oil and pasta',
            },
            {
              id: '2',
              kind: 'payment',
              date: new Date('2026-05-03'),
              amount: 500,
              itemsDescription: null,
            },
          ],
          statementDate: new Date('2026-05-10'),
        },
        lang: 'en',
        expectedChecks: (model) => {
          expect(model.docType).toBe('statement');
          expect(model.title).toBe('Customer Statement');
          expect(model.entityName).toBe('Almaz Gebre');
          expect(model.currentBalanceText).toBe('Current Balance: ETB 0.00');
          expect(model.closingLine).toContain('Account is fully settled');

          const table = model.sections[0].table;
          expect(table.rows).toHaveLength(2);
          // Row 1: borrow 500, balance 500
          expect(table.rows[0].cells[2]).toBe('ETB 500.00');
          expect(table.rows[0].cells[3]).toBe('-');
          expect(table.rows[0].cells[4]).toBe('ETB 500.00');
          // Row 2: payment 500, balance 0
          expect(table.rows[1].cells[2]).toBe('-');
          expect(table.rows[1].cells[3]).toBe('ETB 500.00');
          expect(table.rows[1].cells[4]).toBe('ETB 0.00');
        },
      },
      {
        name: 'Customer name with quotes, special characters, and Amharic letters in am',
        data: {
          shopName: 'ሱቅ "መርካቶ"',
          customerName: 'ወ/ሮ "ማርታ" ታደሰ (መካነ-ኢየሱስ)',
          balance: 1450.75,
          history: [
            {
              id: '1',
              kind: 'borrow',
              date: new Date('2026-07-01'),
              amount: 2000,
              itemsDescription: '2 ከረጢት ስኳር እና ዘይት',
            },
            {
              id: '2',
              kind: 'payment',
              date: new Date('2026-07-15'),
              amount: 549.25,
              itemsDescription: null,
            },
          ],
          statementDate: new Date('2026-08-01'),
        },
        lang: 'am',
        expectedChecks: (model) => {
          expect(model.title).toBe('የደንበኛ ሂሳብ መግለጫ');
          expect(model.entityName).toBe('ወ/ሮ "ማርታ" ታደሰ (መካነ-ኢየሱስ)');
          expect(model.currentBalanceText).toBe('ወቅታዊ ቀሪ ዕዳ፡ ETB 1,450.75');
          expect(model.closingLine).toContain('እባክዎ ቀሪ ዕዳዎን ያጠናቁ');

          const table = model.sections[0].table;
          expect(table.rows).toHaveLength(2);
          expect(table.rows[0].cells[1]).toContain('2 ከረጢት ስኳር እና ዘይት');
          expect(table.rows[1].cells[4]).toBe('ETB 1,450.75');
        },
      },
      {
        name: 'Word docx format includes Ge\'ez font note',
        data: {
          shopName: 'Test Shop',
          customerName: 'Yonas',
          balance: 300,
          history: [],
        },
        lang: 'ti',
        expectedChecks: (model) => {
          expect(model.notes).toBeDefined();
          expect(model.notes[0]).toContain('ኣብ Word ፊደላት ግዕዝ');
        },
      },
    ];

    for (const testCase of tableCases) {
      it(testCase.name, () => {
        const format = testCase.name.includes('Word') ? 'docx' : 'pdf';
        const model = buildStatementDocumentModel(testCase.data, {
          lang: testCase.lang,
          format,
        });
        testCase.expectedChecks(model);
      });
    }
  });
});
