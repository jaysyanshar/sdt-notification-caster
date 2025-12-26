import { DateTime, IANAZone } from 'luxon';
import { MessageType } from '@prisma/client';

export interface UserLike {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: Date;
  timezone: string;
}

const TARGET_HOUR = 9;

export function isValidIanaZone(zone: string): boolean {
  if (!zone || typeof zone !== 'string') return false;

  // Reject pure numeric offset formats like +07:00, -0300, +02
  // while still allowing valid IANA identifiers such as "UTC" or "GMT".
  if (/^[+-]\d{2}(?::?\d{2})?$/.test(zone)) return false;

  // Use Luxon to verify this is a known valid zone.
  if (!IANAZone.isValidZone(zone)) return false;
  const dt = DateTime.now().setZone(zone);
  return dt.isValid;
}

export function parseBirthDate(value: string): DateTime {
  const dt = DateTime.fromISO(value, { zone: 'utc' });
  if (!dt.isValid || value.length !== 10) {
     throw new Error('birthDate must be an ISO date string (YYYY-MM-DD)');
  }

  // Enforce a reasonable birthdate range: in the past, but not more than 150 years ago
  const now = DateTime.utc().startOf('day');
  const earliest = now.minus({ years: 150 });
  if (dt >= now || dt < earliest) {
     throw new Error('birthDate must be in the past and not more than 150 years ago');
  }
  return dt;
}

function adjustLeapDay(month: number, day: number, year: number): { month: number; day: number } {
  if (month === 2 && day === 29 && !DateTime.local(year, 2, 29).isValid) {
    return { month: 2, day: 28 };
  }
  return { month, day };
}

export function calculateNextBirthdayUtc(
  birthDate: string,
  timezone: string,
  now: DateTime = DateTime.utc()
): DateTime {
  const parsed = parseBirthDate(birthDate);
  const nowInZone = now.setZone(timezone);
  const { month, day } = adjustLeapDay(parsed.month, parsed.day, nowInZone.year);

  let scheduledLocal = DateTime.fromObject(
    { year: nowInZone.year, month, day, hour: TARGET_HOUR, minute: 0, second: 0, millisecond: 0 },
    { zone: timezone }
  );

  if (scheduledLocal <= nowInZone) {
    const nextYear = nowInZone.year + 1;
    const adjusted = adjustLeapDay(parsed.month, parsed.day, nextYear);
    scheduledLocal = DateTime.fromObject(
      { year: nextYear, month: adjusted.month, day: adjusted.day, hour: TARGET_HOUR, minute: 0, second: 0, millisecond: 0 },
      { zone: timezone }
    );
  }

  if (!scheduledLocal.isValid) {
    throw new Error('Unable to compute next birthday schedule');
  }

  return scheduledLocal.toUTC();
}

export function buildBirthdayMessage(user: UserLike): string {
  return `Hey, ${user.firstName} ${user.lastName}, it's your birthday`;
}

/**
 * Calculate the next retry attempt time using exponential backoff with jitter.
 * 
 * Retry schedule:
 * - Attempt 0 (1st retry): ~1 second (2^0 = 1s base + jitter)
 * - Attempt 1 (2nd retry): ~2 seconds (2^1 = 2s base + jitter)
 * - Attempt 2 (3rd retry): ~4 seconds (2^2 = 4s base + jitter)
 * - Attempt 3 (4th retry): ~8 seconds (2^3 = 8s base + jitter)
 * - Maximum: 60 minutes (capped)
 * 
 * Jitter is up to 30% of the base delay to prevent thundering herd.
 * 
 * @param attempts - Number of previous attempts (0-indexed)
 * @returns Date object representing when the next retry should occur
 */
export function calculateNextAttempt(attempts: number): Date {
  const baseDelayMs = 1000 * Math.pow(2, attempts); // exponential backoff
  const cappedBase = Math.min(baseDelayMs, 60 * 60 * 1000);
  const jitter = Math.random() * 0.3 * cappedBase;
  const delay = cappedBase + jitter;
  return new Date(Date.now() + delay);
}

export function getNextScheduleForType(type: MessageType, user: UserLike, now: DateTime = DateTime.utc()): Date {
  switch (type) {
    case MessageType.BIRTHDAY:
      return calculateNextBirthdayUtc(user.birthDate.toISOString().slice(0, 10), user.timezone, now).toJSDate();
    default:
      throw new Error(`Unsupported message type ${type}`);
  }
}
