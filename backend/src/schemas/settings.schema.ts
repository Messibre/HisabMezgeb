import { z } from 'zod';

const languageEnum = z.enum(['en', 'am', 'ti']);

export const updateSettingsSchema = z.object({
  body: z.object({
    language: languageEnum.optional(),
    notificationsEnabled: z.boolean().optional(),
  }),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>['body'];
