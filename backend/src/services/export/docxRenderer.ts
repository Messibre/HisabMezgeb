import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { DocumentModel } from './documentModel.js';

const ETHIOPIC_FONT = 'Noto Sans Ethiopic';

/**
 * Render a DocumentModel to a DOCX Buffer.
 */
export async function renderDocumentToDocx(model: DocumentModel): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // ── Shop Name ──
  if (model.shopName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: model.shopName,
            font: ETHIOPIC_FONT,
            bold: true,
            size: 22,
            color: '4B5563',
          }),
        ],
        spacing: { after: 100 },
      }),
    );
  }

  // ── Title ──
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: model.title,
          font: ETHIOPIC_FONT,
          bold: true,
          size: 32,
          color: '111827',
        }),
      ],
      spacing: { after: 120 },
    }),
  );

  // ── Metadata ──
  if (model.entityName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: model.entityName,
            font: ETHIOPIC_FONT,
            bold: true,
            size: 24,
            color: '1F2937',
          }),
        ],
        spacing: { after: 80 },
      }),
    );
  }

  if (model.periodText) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: model.periodText,
            font: ETHIOPIC_FONT,
            size: 20,
            color: '4B5563',
          }),
        ],
        spacing: { after: 80 },
      }),
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: model.generatedDateText,
          font: ETHIOPIC_FONT,
          size: 20,
          color: '4B5563',
        }),
      ],
      spacing: { after: 150 },
    }),
  );

  // ── Current Balance Badge (for Statement) ──
  if (model.currentBalanceText) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: model.currentBalanceText,
                        font: ETHIOPIC_FONT,
                        bold: true,
                        size: 24,
                        color: '312E81',
                      }),
                    ],
                  }),
                ],
                shading: { fill: 'EEF2FF' },
                margins: { top: 120, bottom: 120, left: 160, right: 160 },
              }),
            ],
          }),
        ],
      }),
    );

    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // ── Sections ──
  for (const section of model.sections) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.title,
            font: ETHIOPIC_FONT,
            bold: true,
            size: 24,
            color: '111827',
          }),
        ],
        spacing: { before: 200, after: 120 },
      }),
    );

    // Key-value items as a neat two-column table
    if (section.items && section.items.length > 0) {
      const kvRows = section.items.map((item) => {
        return new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: item.label,
                      font: ETHIOPIC_FONT,
                      bold: item.isBold,
                      size: 20,
                      color: item.isBold ? '111827' : '374151',
                    }),
                  ],
                }),
              ],
              width: { size: 60, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: item.value,
                      font: ETHIOPIC_FONT,
                      bold: item.isBold,
                      size: 20,
                      color: item.isBold ? '111827' : '374151',
                    }),
                  ],
                }),
              ],
              width: { size: 40, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
            }),
          ],
        });
      });

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: kvRows,
        }),
      );
    }

    // Table
    if (section.table) {
      const { columns, rows } = section.table;
      const totalRatio = columns.reduce((acc, c) => acc + (c.widthRatio ?? 1), 0);

      // Header Row
      const headerRow = new TableRow({
        children: columns.map((col) => {
          const widthPercent = Math.round(((col.widthRatio ?? 1) / totalRatio) * 100);
          return new TableCell({
            children: [
              new Paragraph({
                alignment: col.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: col.header,
                    font: ETHIOPIC_FONT,
                    bold: true,
                    size: 19,
                    color: '374151',
                  }),
                ],
              }),
            ],
            width: { size: widthPercent, type: WidthType.PERCENTAGE },
            shading: { fill: 'F3F4F6' },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
          });
        }),
      });

      // Data Rows
      const dataRows = rows.map((r, rIdx) => {
        return new TableRow({
          children: r.cells.map((cellText, cIdx) => {
            const col = columns[cIdx];
            const widthPercent = Math.round(((col?.widthRatio ?? 1) / totalRatio) * 100);
            return new TableCell({
              children: [
                new Paragraph({
                  alignment: col?.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: cellText,
                      font: ETHIOPIC_FONT,
                      bold: r.isBold,
                      size: 19,
                      color: '1F2937',
                    }),
                  ],
                }),
              ],
              width: { size: widthPercent, type: WidthType.PERCENTAGE },
              shading: rIdx % 2 === 1 ? { fill: 'F9FAFB' } : undefined,
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
            });
          }),
        });
      });

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
        }),
      );
    }

    if (section.note) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.note,
              font: ETHIOPIC_FONT,
              size: 18,
              color: '6B7280',
              italics: true,
            }),
          ],
          spacing: { before: 80, after: 120 },
        }),
      );
    }
  }

  // ── Closing line ──
  if (model.closingLine) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: model.closingLine,
            font: ETHIOPIC_FONT,
            bold: true,
            size: 22,
            color: '1F2937',
          }),
        ],
        spacing: { before: 300, after: 150 },
      }),
    );
  }

  // ── Notes ──
  if (model.notes && model.notes.length > 0) {
    for (const note of model.notes) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${note}`,
              font: ETHIOPIC_FONT,
              size: 18,
              color: '6B7280',
              italics: true,
            }),
          ],
          spacing: { after: 60 },
        }),
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
