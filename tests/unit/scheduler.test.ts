import { DateTime } from 'luxon';
import { calculateNextBirthdayUtc, isValidIanaZone } from '../../src/shared/utils/scheduler';

describe('calculateNextBirthdayUtc', () => {
  it('schedules at 09:00 local time for different zones', () => {
    const now = DateTime.fromISO('2024-05-01T00:00:00Z');
    const jakarta = calculateNextBirthdayUtc('1990-05-02', 'Asia/Jakarta', now);
    expect(jakarta.setZone('Asia/Jakarta').hour).toBe(9);
    expect(jakarta.setZone('Asia/Jakarta').minute).toBe(0);

    const newYork = calculateNextBirthdayUtc('1990-05-02', 'America/New_York', now);
    expect(newYork.setZone('America/New_York').hour).toBe(9);
    expect(newYork.setZone('America/New_York').minute).toBe(0);
  });

  it('schedules next year if after 09:00 local time on birthday', () => {
    const now = DateTime.fromISO('2024-05-02T15:00:00Z'); // 11:00 AM in New York (after 09:00 local time)
    const next = calculateNextBirthdayUtc('1990-05-02', 'America/New_York', now);
    expect(next.year).toBe(2025);
  });

  it('schedules Feb 29 birthdays on Feb 28 in non-leap years', () => {
    const now = DateTime.fromISO('2023-01-10T00:00:00Z');
    const next = calculateNextBirthdayUtc('1992-02-29', 'Asia/Jakarta', now);
    const local = next.setZone('Asia/Jakarta');
    expect(local.month).toBe(2);
    expect(local.day).toBe(28);
  });
});

describe('timezone validation', () => {
  it('rejects invalid IANA zones', () => {
    expect(isValidIanaZone('Invalid/Zone')).toBe(false);
    expect(isValidIanaZone('+07:00')).toBe(false);
  });

  it('accepts valid IANA zones', () => {
    expect(isValidIanaZone('America/New_York')).toBe(true);
    expect(isValidIanaZone('Asia/Jakarta')).toBe(true);
  });
});
