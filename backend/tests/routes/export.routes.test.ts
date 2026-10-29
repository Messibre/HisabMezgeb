import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import reportsRoutes from '../../src/routes/reports.routes.js';
import debtCustomerRoutes from '../../src/routes/debtCustomer.routes.js';
import * as exportService from '../../src/services/export/export.service.js';
import * as debtCustomerService from '../../src/services/debtCustomer.service.js';
import errorMiddleware from '../../src/middlewares/error.middleware.js';
import ApiError from '../../src/utils/ApiError.js';
import { HTTP_STATUS, ERROR_CODES } from '../../src/constants/index.js';

let testAccountCounter = 0;
let currentAccountId: string | null = 'acc-1';

vi.mock('../../src/middlewares/auth.middleware.js', () => ({
  default: vi.fn((req: any, res: any, next: any) => {
    if (!currentAccountId) {
      return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }
    req.accountId = currentAccountId;
    next();
  }),
}));

describe('Export Endpoints: Reports & Customer Statement', () => {
  let app: express.Application;
  const validCustomerId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    testAccountCounter++;
    currentAccountId = `acc-test-${testAccountCounter}`;
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/v1/reports', reportsRoutes);
    app.use('/api/v1/debt-customers', debtCustomerRoutes);
    app.use(errorMiddleware);
    vi.clearAllMocks();
  });

  describe('GET /api/v1/reports/export', () => {
    it('requires authentication (returns 401 when unauthenticated)', async () => {
      currentAccountId = null;
      const res = await request(app).get('/api/v1/reports/export?from=2026-01-01&to=2026-01-31');
      expect(res.status).toBe(401);
    });

    it('validates date format (returns 400 for invalid dates)', async () => {
      const res = await request(app).get('/api/v1/reports/export?from=not-a-date&to=2026-01-31');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
    });

    it('validates from <= to (returns 400 when from is after to)', async () => {
      const res = await request(app).get('/api/v1/reports/export?from=2026-05-10&to=2026-05-01');
      expect(res.status).toBe(400);
      expect(res.body.errors[0]).toContain('from date must be before or equal to to date');
    });

    it('validates date range <= 366 days (returns 400 for > 366 days)', async () => {
      const res = await request(app).get('/api/v1/reports/export?from=2025-01-01&to=2026-06-01');
      expect(res.status).toBe(400);
      expect(res.body.errors[0]).toContain('Date range cannot exceed 366 days');
    });

    it('validates format from allowed list (returns 400 for invalid format)', async () => {
      const res = await request(app).get(
        '/api/v1/reports/export?from=2026-01-01&to=2026-01-31&format=exe',
      );
      expect(res.status).toBe(400);
    });

    it('validates lang from allowed list (returns 400 for invalid lang)', async () => {
      const res = await request(app).get(
        '/api/v1/reports/export?from=2026-01-01&to=2026-01-31&lang=fr',
      );
      expect(res.status).toBe(400);
    });

    it('successfully exports PDF report with correct headers and no-store cache control', async () => {
      const mockPdfBuffer = Buffer.from('%PDF-1.4 test report pdf content');
      vi.spyOn(exportService, 'exportReport').mockResolvedValueOnce({
        buffer: mockPdfBuffer,
        filename: 'hisab-report-2026-01-01_to_2026-01-31.pdf',
        contentType: 'application/pdf',
      });

      const res = await request(app)
        .get('/api/v1/reports/export?from=2026-01-01&to=2026-01-31&format=pdf&lang=am')
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('hisab-report-2026-01-01_to_2026-01-31.pdf');
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body).toEqual(mockPdfBuffer);
    });

    it('successfully exports DOCX report with correct headers', async () => {
      const mockDocxBuffer = Buffer.from('PK-docx-content');
      vi.spyOn(exportService, 'exportReport').mockResolvedValueOnce({
        buffer: mockDocxBuffer,
        filename: 'hisab-report-2026-01-01_to_2026-01-31.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const res = await request(app)
        .get('/api/v1/reports/export?from=2026-01-01&to=2026-01-31&format=docx&lang=ti')
        .expect(200);

      expect(res.headers['content-type']).toContain('wordprocessingml.document');
      expect(res.headers['cache-control']).toBe('no-store');
    });
  });

  describe('GET /api/v1/debt-customers/:id/statement', () => {
    it('requires authentication (returns 401 when unauthenticated)', async () => {
      currentAccountId = null;
      const res = await request(app).get(`/api/v1/debt-customers/${validCustomerId}/statement`);
      expect(res.status).toBe(401);
    });

    it('validates UUID for customer id (returns 400 for invalid id)', async () => {
      const res = await request(app).get('/api/v1/debt-customers/not-a-uuid/statement');
      expect(res.status).toBe(400);
      expect(res.body.errors[0]).toContain('Invalid customer ID');
    });

    it('returns 404 CUSTOMER_NOT_FOUND if customer belongs to another account or does not exist', async () => {
      vi.spyOn(exportService, 'exportCustomerStatement').mockRejectedValueOnce(
        new ApiError(
          HTTP_STATUS.NOT_FOUND,
          'Debt customer not found',
          [],
          ERROR_CODES.CUSTOMER_NOT_FOUND,
        ),
      );

      const res = await request(app)
        .get(`/api/v1/debt-customers/${validCustomerId}/statement?format=pdf&lang=en`)
        .expect(404);

      expect(res.body.message).toBe('Debt customer not found');
      expect(res.body.code).toBe(ERROR_CODES.CUSTOMER_NOT_FOUND);
    });

    it('rejects CSV for customer statement (only pdf or docx allowed)', async () => {
      const res = await request(app).get(
        `/api/v1/debt-customers/${validCustomerId}/statement?format=csv`,
      );
      expect(res.status).toBe(400);
    });

    it('successfully exports customer statement as PDF with safe filename header', async () => {
      const mockPdfBuffer = Buffer.from('%PDF-statement');
      vi.spyOn(exportService, 'exportCustomerStatement').mockResolvedValueOnce({
        buffer: mockPdfBuffer,
        filename: 'statement-Abebe_Beso-2026-10-29.pdf',
        contentType: 'application/pdf',
      });

      const res = await request(app)
        .get(`/api/v1/debt-customers/${validCustomerId}/statement?format=pdf&lang=am`)
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename="statement-Abebe_Beso-2026-10-29.pdf"');
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body).toEqual(mockPdfBuffer);
    });

    it('enforces rate limiting per account (returns 429 when quota exceeded)', async () => {
      const rateLimitedAccountId = 'rate-limited-account-999';
      currentAccountId = rateLimitedAccountId;

      vi.spyOn(exportService, 'exportCustomerStatement').mockResolvedValue({
        buffer: Buffer.from('%PDF-data'),
        filename: 'statement.pdf',
        contentType: 'application/pdf',
      });

      // Send 10 successful requests
      for (let i = 0; i < 10; i++) {
        await request(app)
          .get(`/api/v1/debt-customers/${validCustomerId}/statement?format=pdf`)
          .expect(200);
      }

      // 11th request should be rate limited with 429
      const res = await request(app)
        .get(`/api/v1/debt-customers/${validCustomerId}/statement?format=pdf`)
        .expect(429);

      expect(res.body.code).toBe(ERROR_CODES.RATE_LIMITED);
    });
  });

  describe('Safe Filename Sanitization', () => {
    it('strips newlines, quotes, slashes, and control characters', () => {
      const unsafe = 'statement-"John/Doe"\r\n;\'; DROP TABLE accounts;--';
      const safe = exportService.buildSafeFilename(unsafe, 'pdf');
      expect(safe).not.toContain('\r');
      expect(safe).not.toContain('\n');
      expect(safe).not.toContain('"');
      expect(safe).not.toContain('/');
      expect(safe).not.toContain(';');
      expect(safe.endsWith('.pdf')).toBe(true);
    });

    it('handles unicode and Amharic names safely for ASCII filename fallback', () => {
      const amharicName = 'statement-አበበ-2026-10-29';
      const safe = exportService.buildSafeFilename(amharicName, 'docx');
      expect(safe.endsWith('.docx')).toBe(true);
      expect(safe.length).toBeGreaterThan(0);
      expect(/^[\w-]+\.docx$/.test(safe)).toBe(true);
    });
  });
});
