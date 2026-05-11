/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import * as supabaseServer from '@/lib/supabaseServer';
import * as getWeeklyUsageModule from '@/lib/getWeeklyUsage';

// Vi mockar bort databasen och auth-modulen
vi.mock('@/lib/supabaseServer');
vi.mock('@/lib/getWeeklyUsage');

describe('API Route: /api/impact', () => {
  const mockUser = { id: 'user_abc_123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- TEST 1: AUTHENTICATION ---
  it('ska returnera 401 om sessionen saknas', async () => {
    (supabaseServer.createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) }
    });

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ user_id: 'user_abc_123', category: 'co2' })
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'You have not logged in' });
  });

  // --- TEST 2: VALIDERING AV JSON-BODY ---
  it('ska returnera 400 om user_id eller category saknas i bodyn', async () => {
    (supabaseServer.createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) }
    });

    // Skickar en tom body
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ category: 'co2' }) // user_id saknas
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Missing user_id or category' });
  });

  it('ska returnera 400 om kategorin är ogiltig', async () => {
    (supabaseServer.createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) }
    });

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ user_id: 'user_abc_123', category: 'pizza' }) // ogiltig
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid category' });
  });

  // --- TEST 3: BEHÖRIGHETSKONTROLL (USER MATCH) ---
  it('ska returnera 403 om man försöker hämta data för en annan användare', async () => {
    (supabaseServer.createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) }
    });

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ user_id: 'någon_annan_id', category: 'co2' })
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'You are not allowed to access this user data' });
  });

  // --- TEST 4: KORREKTA BERÄKNINGAR ---
  it('ska beräkna vattenpåverkan korrekt (total / 4)', async () => {
    (supabaseServer.createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) }
    });

    // Mocka att databasen returnerar 100 liter
    vi.spyOn(getWeeklyUsageModule, 'getWeeklyUsage').mockResolvedValue(100);

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ user_id: 'user_abc_123', category: 'water' })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.impact_value).toBe(25); // 100 / 4 = 25
    expect(data.text).toBe('Your water usage from the last 7 days could irrigate 25 m² of farmland for one day.');
  });

  // --- TEST 5: SYSTEMFEL ---
  it('ska returnera 500 om databasanropet kraschar', async () => {
    (supabaseServer.createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) }
    });

    // Simulera ett oväntat fel (t.ex. nätverksfel till databasen)
    vi.spyOn(getWeeklyUsageModule, 'getWeeklyUsage').mockRejectedValue(new Error('DB Crash'));

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ user_id: 'user_abc_123', category: 'co2' })
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Something went wrong' });
  });
});