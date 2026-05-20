import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildTimeRanges,
  computeFromDate,
  getLast7Days,
  getRolling5Weeks,
  runMetric,
  seedLastKnownFromPriorScore,
  type MetricRow,
} from './historical-metrics';

const FIXED_NOW = new Date('2026-05-20T12:00:00.000Z');

describe('historical-metrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('computeFromDate', () => {
    it('returns the earliest of year start, last 7 days, and 5 rolling weeks', () => {
      expect(computeFromDate()).toBe('2026-01-01');
    });

    it('uses rolling week window when that is earlier than year start', () => {
      vi.setSystemTime(new Date('2026-01-05T12:00:00.000Z'));
      expect(computeFromDate()).toBe('2025-12-08');
    });
  });

  describe('getRolling5Weeks', () => {
    it('returns 5 weeks with current week as Week 5', () => {
      const weeks = getRolling5Weeks();
      expect(weeks).toHaveLength(5);
      expect(weeks[0].label).toBe('Week 1');
      expect(weeks[4].label).toBe('Week 5');
      expect(weeks[4].weekStart).toBe('2026-05-18');
      expect(weeks[4].weekEnd).toBe('2026-05-24');
    });
  });

  describe('getLast7Days', () => {
    it('orders oldest first with today last', () => {
      const days = getLast7Days();
      expect(days).toHaveLength(7);
      expect(days[0].dateStr).toBe('2026-05-14');
      expect(days[6].dateStr).toBe('2026-05-20');
    });
  });

  describe('runMetric sum', () => {
    const ranges = buildTimeRanges();

    it('sums activity values per day and week', () => {
      const rows: MetricRow[] = [
        { day: '2026-05-20', co2_kg: 1.5 },
        { day: '2026-05-20', co2_kg: 0.85 },
        { day: '2026-05-18', co2_kg: 2 },
      ];

      const result = runMetric(rows, ranges, {
        metricField: 'co2_kg',
        aggregation: 'sum',
        decimals: 2,
      });

      expect(result.daily).toBe(2.35);
      expect(result.weekly[6].total).toBe(2.35);
      expect(result.weekly[4].total).toBe(2);
    });

    it('returns zeros when no rows', () => {
      const result = runMetric([], ranges, {
        metricField: 'co2_kg',
        aggregation: 'sum',
        decimals: 2,
      });

      expect(result.daily).toBe(0);
      expect(result.weekly.every((d) => d.total === 0)).toBe(true);
      expect(result.monthly.every((w) => w.total === 0)).toBe(true);
      expect(result.yearly.every((m) => m.total === 0)).toBe(true);
    });
  });

  describe('runMetric latest_value with carry-forward', () => {
    const ranges = buildTimeRanges();

    it('carries score across days in weekly series', () => {
      const rows: MetricRow[] = [
        { day: '2026-05-18', score: 500 },
        { day: '2026-05-20', score: 520 },
      ];

      const result = runMetric(rows, ranges, {
        metricField: 'score',
        aggregation: 'latest_value',
        decimals: 0,
        carryForward: true,
        initialLastKnown: 0,
      });

      expect(result.weekly[0].total).toBe(0);
      expect(result.weekly[4].total).toBe(500);
      expect(result.weekly[5].total).toBe(500);
      expect(result.weekly[6].total).toBe(520);
      expect(result.daily).toBe(520);
    });

    it('carries score across empty months in yearly series', () => {
      const rows: MetricRow[] = [
        { day: '2026-01-15', score: 480 },
        { day: '2026-03-10', score: 510 },
      ];

      const result = runMetric(rows, ranges, {
        metricField: 'score',
        aggregation: 'latest_value',
        decimals: 0,
        carryForward: true,
        initialLastKnown: 0,
      });

      expect(result.yearly[0].total).toBe(480);
      expect(result.yearly[1].total).toBe(480);
      expect(result.yearly[2].total).toBe(510);
      expect(result.yearly[3].total).toBe(510);
      expect(result.yearly[4].total).toBe(510);
      expect(result.yearly.slice(5).every((m) => m.total === 0)).toBe(true);
    });

    it('does not carry score into future months in yearly series', () => {
      const rows: MetricRow[] = [{ day: '2026-03-10', score: 510 }];

      const result = runMetric(rows, ranges, {
        metricField: 'score',
        aggregation: 'latest_value',
        decimals: 0,
        carryForward: true,
        initialLastKnown: 0,
      });

      expect(result.yearly[2].total).toBe(510);
      expect(result.yearly[4].total).toBe(510);
      expect(result.yearly[5].total).toBe(0);
      expect(result.yearly[11].total).toBe(0);
    });

    it('uses initialLastKnown seed for leading buckets', () => {
      const rows: MetricRow[] = [{ day: '2026-05-20', score: 600 }];

      const result = runMetric(rows, ranges, {
        metricField: 'score',
        aggregation: 'latest_value',
        decimals: 0,
        carryForward: true,
        initialLastKnown: 450,
      });

      expect(result.weekly[0].total).toBe(450);
      expect(result.weekly[6].total).toBe(600);
    });
  });

  describe('seedLastKnownFromPriorScore', () => {
    it('returns latest score strictly before fromDate', () => {
      const rows: MetricRow[] = [
        { day: '2025-12-01', score: 400 },
        { day: '2025-12-28', score: 475 },
      ];
      expect(seedLastKnownFromPriorScore(rows, '2026-01-01', 'score')).toBe(475);
    });

    it('returns 0 when no prior rows', () => {
      expect(seedLastKnownFromPriorScore([], '2026-01-01', 'score')).toBe(0);
    });
  });
});
