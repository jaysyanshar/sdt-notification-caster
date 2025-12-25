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
    .refine((value) => {
      try {
        parseBirthDate(value);
        return true;
      } catch (err) {
        return false;
      }
    }, 'Invalid birthDate'),
  timezone: z.string().refine((value) => isValidIanaZone(value), 'Invalid IANA timezone'),
});

export type UserInput = z.infer<typeof userSchema>;
