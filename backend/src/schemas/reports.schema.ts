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

export type ReportPeriodQuery = z.infer<typeof reportPeriodSchema>['query'];
