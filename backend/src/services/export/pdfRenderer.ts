import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { DocumentModel } from './documentModel.js';

function getFontPaths() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), 'assets/fonts'),
    path.resolve(currentDir, '../../../assets/fonts'),
    path.resolve(currentDir, '../../assets/fonts'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return {
        ethiopicRegular: path.join(c, 'NotoSansEthiopic-Regular.ttf'),
        ethiopicBold: path.join(c, 'NotoSansEthiopic-Bold.ttf'),
        latinRegular: path.join(c, 'NotoSans-Regular.ttf'),
        latinBold: path.join(c, 'NotoSans-Bold.ttf'),
      };
    }
  }
  throw new Error('Assets/fonts directory not found');
}

/**
 * Render a DocumentModel to a PDF Buffer using PDFKit with embedded Noto Sans Ethiopic.
 */
export async function renderDocumentToPdf(model: DocumentModel): Promise<Buffer> {
  const fontPaths = getFontPaths();

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Register fonts with Unicode font subsetting
      doc.registerFont('Ethiopic', fontPaths.ethiopicRegular);
      doc.registerFont('Ethiopic-Bold', fontPaths.ethiopicBold);
      doc.registerFont('Latin', fontPaths.latinRegular);
      doc.registerFont('Latin-Bold', fontPaths.latinBold);

      // Default font
      doc.font('Ethiopic').fontSize(10);

      const margin = 40;
      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - margin * 2;

      // ── Header ──
      if (model.shopName) {
        doc.font('Ethiopic-Bold').fontSize(13).fillColor('#4B5563').text(model.shopName);
        doc.moveDown(0.2);
      }

      // Title
      doc.font('Ethiopic-Bold').fontSize(20).fillColor('#111827').text(model.title);
      doc.moveDown(0.3);

      // Subhead metadata
      doc.font('Ethiopic').fontSize(10).fillColor('#4B5563');
      if (model.entityName) {
        doc.font('Ethiopic-Bold').fontSize(13).fillColor('#1F2937').text(model.entityName);
        doc.font('Ethiopic').fontSize(10).fillColor('#4B5563');
      }
      if (model.periodText) {
        doc.text(model.periodText);
      }
      doc.text(model.generatedDateText);

      // Current balance highlight badge (for statements)
      if (model.currentBalanceText) {
        doc.moveDown(0.5);
        const badgeY = doc.y;
        doc.rect(margin, badgeY, contentWidth, 28).fill('#EEF2FF');
        doc.font('Ethiopic-Bold').fontSize(12).fillColor('#312E81').text(model.currentBalanceText, margin + 12, badgeY + 7);
        doc.y = badgeY + 36;
      }

      // Divider line
      doc.moveDown(0.5);
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).stroke();
      doc.moveDown(0.8);

      // ── Sections ──
      for (const section of model.sections) {
        // Check page overflow
        if (doc.y > doc.page.height - 120) {
          doc.addPage();
        }

        doc.font('Ethiopic-Bold').fontSize(13).fillColor('#111827').text(section.title);
        doc.moveDown(0.3);

        // Key-value items
        if (section.items && section.items.length > 0) {
          for (const item of section.items) {
            if (doc.y > doc.page.height - 60) {
              doc.addPage();
            }
            const yPos = doc.y;
            const fontName = item.isBold ? 'Ethiopic-Bold' : 'Ethiopic';
            const color = item.isBold ? '#111827' : '#374151';

            doc.font(fontName).fontSize(10).fillColor(color).text(item.label, margin + (item.indent ? 12 : 0), yPos, {
              width: contentWidth * 0.65,
            });
            doc.font(fontName).fontSize(10).fillColor(color).text(item.value, margin + contentWidth * 0.65, yPos, {
              width: contentWidth * 0.35,
              align: 'right',
            });
            doc.moveDown(0.35);
          }
        }

        // Table
        if (section.table) {
          const { columns, rows } = section.table;
          const totalRatio = columns.reduce((acc, c) => acc + (c.widthRatio ?? 1), 0);
          const colWidths = columns.map((c) => ((c.widthRatio ?? 1) / totalRatio) * contentWidth);

          // Table Header
          let tableY = doc.y + 4;
          if (tableY > doc.page.height - 80) {
            doc.addPage();
            tableY = margin;
          }

          const headerHeight = 22;
          doc.rect(margin, tableY, contentWidth, headerHeight).fill('#F3F4F6');

          let x = margin;
          for (let i = 0; i < columns.length; i++) {
            const col = columns[i];
            const w = colWidths[i];
            doc.font('Ethiopic-Bold').fontSize(9).fillColor('#374151').text(col.header, x + 4, tableY + 6, {
              width: w - 8,
              align: col.align ?? 'left',
            });
            x += w;
          }

          let currentY = tableY + headerHeight;

          // Table Rows
          for (let rIdx = 0; rIdx < rows.length; rIdx++) {
            const row = rows[rIdx];
            const rowHeight = 20;

            if (currentY + rowHeight > doc.page.height - 50) {
              doc.addPage();
              currentY = margin;
            }

            if (rIdx % 2 === 1) {
              doc.rect(margin, currentY, contentWidth, rowHeight).fill('#F9FAFB');
            }

            x = margin;
            const fontName = row.isBold ? 'Ethiopic-Bold' : 'Ethiopic';
            for (let cIdx = 0; cIdx < columns.length; cIdx++) {
              const cellText = row.cells[cIdx] ?? '';
              const col = columns[cIdx];
              const w = colWidths[cIdx];

              doc.font(fontName).fontSize(9).fillColor('#1F2937').text(cellText, x + 4, currentY + 5, {
                width: w - 8,
                align: col.align ?? 'left',
              });
              x += w;
            }

            // Divider line below each row
            doc.strokeColor('#E5E7EB').lineWidth(0.5).moveTo(margin, currentY + rowHeight).lineTo(pageWidth - margin, currentY + rowHeight).stroke();

            currentY += rowHeight;
          }

          doc.y = currentY + 8;
        }

        // Section note
        if (section.note) {
          doc.font('Ethiopic').fontSize(8.5).fillColor('#6B7280').text(section.note, { width: contentWidth });
          doc.moveDown(0.3);
        }

        doc.moveDown(0.6);
      }

      // ── Notes & Closing ──
      if (doc.y > doc.page.height - 90) {
        doc.addPage();
      }

      if (model.closingLine) {
        doc.moveDown(0.5);
        doc.font('Ethiopic-Bold').fontSize(11).fillColor('#1F2937').text(model.closingLine, { align: 'center' });
        doc.moveDown(0.5);
      }

      if (model.notes && model.notes.length > 0) {
        for (const note of model.notes) {
          doc.font('Ethiopic').fontSize(8.5).fillColor('#6B7280').text(`• ${note}`, { width: contentWidth });
          doc.moveDown(0.2);
        }
      }

      // Page numbers footer
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const oldBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        doc.font('Ethiopic').fontSize(8).fillColor('#9CA3AF').text(
          `Hisab Mezgeb — Page ${i + 1} of ${range.count}`,
          margin,
          doc.page.height - 24,
          { align: 'center', width: contentWidth, lineBreak: false },
        );
        doc.page.margins.bottom = oldBottom;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
