import { DayOffset } from './habit-types';

export function resolveDayFromOffset(dayOffset: DayOffset, now = new Date()): string {
  // Keep day resolution centralized and UTC-based until timezone support is added.
  const target = new Date(now);
  target.setUTCDate(target.getUTCDate() - dayOffset);
  return target.toISOString().slice(0, 10);
}
