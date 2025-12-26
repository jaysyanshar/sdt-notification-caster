import { z } from 'zod';
import { isValidIanaZone, parseBirthDate } from '../../shared/utils/scheduler';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const userSchema = z.object({
  firstName: z.string().min(1, 'firstName is required'),
  lastName: z.string().min(1, 'lastName is required'),
  email: z.string().email('Invalid email'),
  birthDate: z
    .string()
    .regex(isoDateRegex, 'birthDate must be in YYYY-MM-DD format')
    .refine(
      (value) => {
        try {
          parseBirthDate(value);
          return true;
        } catch (err) {
          return false;
        }
      },
      (value) => {
        try {
          parseBirthDate(value);
          return { message: 'Invalid birthDate' };
        } catch (err: any) {
          return { message: err?.message ?? 'Invalid birthDate' };
        }
      },
    ),
  timezone: z.string().superRefine((value, ctx) => {
    // Disallow offset-style timezones like "+07:00" and provide a clear message.
    const offsetPattern = /^[+-]\d{2}:\d{2}$/;
    if (offsetPattern.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Timezone offsets like "+07:00" are not valid IANA timezones. Please use a named IANA timezone (e.g., "Asia/Bangkok").',
      });
      return;
    }

    // For non-offset values, defer to isValidIanaZone and explain if the zone does not exist.
    if (!isValidIanaZone(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Timezone must be an existing IANA timezone identifier (e.g., "America/New_York").',
      });
    }
  }),
});

export type UserInput = z.infer<typeof userSchema>;
