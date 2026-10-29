import { z } from 'zod';

const dateSchema = z.coerce
  .date()
  .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date format. Use YYYY-MM-DD' });

export const reportPeriodSchema = z.object({
  query: z
    .object({
      from: dateSchema,
      to: dateSchema,
    })
    .refine((data) => data.from <= data.to, {
      message: 'from date must be before or equal to to date',
    }),
});

const MAX_EXPORT_RANGE_MS = 366 * 24 * 60 * 60 * 1000;

export const exportReportSchema = z.object({
  query: z
    .object({
      from: dateSchema,
      to: dateSchema,
      format: z.enum(['pdf', 'docx', 'csv']).default('csv'),
      lang: z.enum(['en', 'am', 'ti']).default('en'),
    })
    .refine((data) => data.from <= data.to, {
      message: 'from date must be before or equal to to date',
    })
    .refine((data) => data.to.getTime() - data.from.getTime() <= MAX_EXPORT_RANGE_MS, {
      message: 'Date range cannot exceed 366 days',
    }),
});

export type ReportPeriodQuery = z.infer<typeof reportPeriodSchema>['query'];
export type ExportReportQuery = z.infer<typeof exportReportSchema>['query'];
