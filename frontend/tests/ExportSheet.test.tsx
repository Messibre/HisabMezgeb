import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportSheet, { extractFilenameFromHeader } from '@/components/common/ExportSheet';
import api from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('ExportSheet Component and Helpers', () => {
  const origCreateObjectURL = window.URL.createObjectURL;
  const origRevokeObjectURL = window.URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    window.URL.createObjectURL = origCreateObjectURL;
    window.URL.revokeObjectURL = origRevokeObjectURL;
  });

  describe('extractFilenameFromHeader', () => {
    it('returns fallback if header is undefined or empty', () => {
      expect(extractFilenameFromHeader(undefined, 'fallback.pdf')).toBe('fallback.pdf');
      expect(extractFilenameFromHeader('', 'fallback.pdf')).toBe('fallback.pdf');
    });

    it('extracts filename from standard Content-Disposition', () => {
      expect(
        extractFilenameFromHeader('attachment; filename="hisab-report-2026.pdf"')
      ).toBe('hisab-report-2026.pdf');
      expect(
        extractFilenameFromHeader('attachment; filename=statement-abebe.docx')
      ).toBe('statement-abebe.docx');
    });

    it('extracts RFC 5987 UTF-8 encoded filename', () => {
      const header = "attachment; filename=\"report.pdf\"; filename*=UTF-8''hisab-report-%E1%8A%A0%E1%89%A0%E1%89%A0.pdf";
      expect(extractFilenameFromHeader(header)).toBe('hisab-report-አበበ.pdf');
    });
  });

  describe('Render Report Export options', () => {
    it('renders report title, 3 formats (pdf, docx, csv), and languages', () => {
      render(
        <ExportSheet
          open={true}
          onOpenChange={vi.fn()}
          type="report"
          reportParams={{ from: '2026-10-01', to: '2026-10-26' }}
        />
      );

      expect(screen.getByText(/export report/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /PDF/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Word/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /CSV/i })).toBeInTheDocument();

      // Language buttons
      expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'አማርኛ' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ትግርኛ' })).toBeInTheDocument();
    });

    it('shows Word Ge\'ez notice when Word format is selected', () => {
      render(
        <ExportSheet
          open={true}
          onOpenChange={vi.fn()}
          type="report"
          reportParams={{ from: '2026-10-01', to: '2026-10-26' }}
        />
      );

      // Select Word
      const docxBtn = screen.getByRole('button', { name: /Word/i });
      fireEvent.click(docxBtn);

      expect(
        screen.getByText(/Viewing Ge'ez characters in Word requires a Ge'ez font/i)
      ).toBeInTheDocument();
    });
  });

  describe('Render Customer Statement options', () => {
    it('renders statement title, does not include CSV format', () => {
      render(
        <ExportSheet
          open={true}
          onOpenChange={vi.fn()}
          type="statement"
          customerId="cust-123"
          customerName="Abebe Bikila"
        />
      );

      expect(screen.getByText(/share customer statement/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /PDF/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Word/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /CSV/i })).not.toBeInTheDocument();
    });
  });

  describe('Download flow and Error handling', () => {
    it('triggers download with temporary URL and revokes it on success', async () => {
      const mockBlob = new Blob(['mock content'], { type: 'application/pdf' });
      (api.get as any).mockResolvedValue({
        data: mockBlob,
        headers: {
          'content-disposition': 'attachment; filename="hisab-report-test.pdf"',
        },
      });

      const onOpenChange = vi.fn();
      render(
        <ExportSheet
          open={true}
          onOpenChange={onOpenChange}
          type="report"
          reportParams={{ from: '2026-10-01', to: '2026-10-26' }}
        />
      );

      const downloadBtn = screen.getByRole('button', { name: /^download$/i });
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          expect.stringContaining('/reports/export?from=2026-10-01&to=2026-10-26&format=pdf&lang='),
          expect.objectContaining({ responseType: 'blob', timeout: 60000 })
        );
        expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('handles timeout error gracefully', async () => {
      const timeoutErr = new Error('timeout of 60000ms exceeded');
      (timeoutErr as any).code = 'ECONNABORTED';
      (api.get as any).mockRejectedValue(timeoutErr);

      render(
        <ExportSheet
          open={true}
          onOpenChange={vi.fn()}
          type="report"
          reportParams={{ from: '2026-10-01', to: '2026-10-26' }}
        />
      );

      const downloadBtn = screen.getByRole('button', { name: /^download$/i });
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });
    });

    it('handles offline condition with friendly error', async () => {
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      render(
        <ExportSheet
          open={true}
          onOpenChange={vi.fn()}
          type="report"
          reportParams={{ from: '2026-10-01', to: '2026-10-26' }}
        />
      );

      const downloadBtn = screen.getByRole('button', { name: /^download$/i });
      fireEvent.click(downloadBtn);

      // api.get should not be called when offline
      expect(api.get).not.toHaveBeenCalled();

      Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
    });
  });

  describe('System Share flow', () => {
    it('uses navigator.share when available with file sharing', async () => {
      const mockBlob = new Blob(['mock-pdf'], { type: 'application/pdf' });
      (api.get as any).mockResolvedValue({
        data: mockBlob,
        headers: {
          'content-disposition': 'attachment; filename="statement-test.pdf"',
        },
      });

      const shareMock = vi.fn().mockResolvedValue(undefined);
      const canShareMock = vi.fn().mockReturnValue(true);

      Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });
      Object.defineProperty(navigator, 'canShare', { value: canShareMock, configurable: true });

      const onOpenChange = vi.fn();
      render(
        <ExportSheet
          open={true}
          onOpenChange={onOpenChange}
          type="statement"
          customerId="cust-123"
          customerName="Tigist"
        />
      );

      const shareBtn = screen.getByRole('button', { name: /^share$/i });
      fireEvent.click(shareBtn);

      await waitFor(() => {
        expect(canShareMock).toHaveBeenCalled();
        expect(shareMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'statement-test.pdf',
            files: expect.any(Array),
          })
        );
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
