/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import * as supabaseServer from '@/lib/supabaseServer';
import * as habitHandlers from '@/utils/habit-handlers';

vi.mock('@/lib/supabaseServer');
vi.mock('@/utils/habit-handlers');

describe('API Route: /api/log-habit', () => {
  const mockUser = { id: 'user_abc_123' };
  const mockStore = vi.fn();
  const mockParse = vi.fn((body) => body);
  const mockCalculate = vi.fn(async () => ({
    metrics: { co2_kg: 1.2, water_l: 0, energy_kwh: 0 },
    extra: { distanceInKm: 10 },
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T10:00:00.000Z'));

    (supabaseServer.createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    mockStore.mockImplementation(async ({ day, category, userId, metrics, parsed, extra }) => ({
      id: 'activity_123',
      user_id: userId,
      category,
      co2_kg: metrics.co2_kg,
      water_l: metrics.water_l,
      energy_kwh: metrics.energy_kwh,
      details: { ...parsed, ...extra },
      day,
      created_at: '2026-05-12T10:00:00.000Z',
    }));

    (habitHandlers.getHabitHandler as any).mockReturnValue({
      parse: mockParse,
      calculate: mockCalculate,
      store: mockStore,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores today when dayOffset is 0', async () => {
    const req = new NextRequest('http://localhost/api/log-habit', {
      method: 'POST',
      body: JSON.stringify({
        category: 'transport',
        dayOffset: 0,
        body: {
          start: 'Stockholm',
          destination: 'Uppsala',
          transportMode: 'train',
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(mockStore).toHaveBeenCalledWith(expect.objectContaining({ day: '2026-05-12' }));
    expect(data.data.day).toBe('2026-05-12');
  });

  it('stores yesterday when dayOffset is 1', async () => {
    const req = new NextRequest('http://localhost/api/log-habit', {
      method: 'POST',
      body: JSON.stringify({
        category: 'transport',
        dayOffset: 1,
        body: {
          start: 'Stockholm',
          destination: 'Uppsala',
          transportMode: 'train',
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(mockStore).toHaveBeenCalledWith(expect.objectContaining({ day: '2026-05-11' }));
    expect(data.data.day).toBe('2026-05-11');
  });

  it('rejects offsets outside 0 and 1', async () => {
    const req = new NextRequest('http://localhost/api/log-habit', {
      method: 'POST',
      body: JSON.stringify({
        category: 'transport',
        dayOffset: 2,
        body: {
          start: 'Stockholm',
          destination: 'Uppsala',
          transportMode: 'train',
        },
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'dayOffset must be 0 or 1' });
    expect(mockStore).not.toHaveBeenCalled();
  });
});
