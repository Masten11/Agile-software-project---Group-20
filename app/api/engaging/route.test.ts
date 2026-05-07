import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import * as supabaseServer from '@/lib/supabaseServer';
import * as getWeeklyUsageModule from '@/lib/getWeeklyUsage';

// Mocka externa beroenden
vi.mock('@/lib/supabaseServer');
vi.mock('@/lib/getWeeklyUsage');

describe('POST /api/impact', () => {
  const mockUser = { id: 'user_123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ska returnera 401 om användaren inte är inloggad', async () => {
    // Simulera att getUser returnerar null/error
    (supabaseServer.createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Auth failed') }) }
    });

    const req = new NextRequest('http://localhost/api/impact', {
      method: 'POST',
      body: JSON.stringify({ user_id: 'user_123', category: 'co2' })
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('You have not logged in');
  });

  it('ska returnera 403 om user_id inte matchar inloggad användare', async () => {
    (supabaseServer.createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) }
    });

    const req = new NextRequest('http://localhost/api/impact', {
      method: 'POST',
      body: JSON.stringify({ user_id: 'wrong_user', category: 'co2' })
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('ska beräkna korrekt impact value för co2', async () => {
    // 1. Mocka inloggad användare
    (supabaseServer.createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) }
    });

    // 2. Mocka databas-svar (getWeeklyUsage returnerar t.ex. 100 kg CO2)
    vi.spyOn(getWeeklyUsageModule, 'getWeeklyUsage').mockResolvedValue(100);

    const req = new NextRequest('http://localhost/api/impact', {
      method: 'POST',
      body: JSON.stringify({ user_id: 'user_123', category: 'co2' })
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    // 100 / 20 = 5 enligt din config.ts
    expect(json.impact_value).toBe(5);
    expect(json.text).toContain('5 trees');
    expect(json.total_unit).toBe('kg_co2');
  });

  it('ska returnera 400 för en ogiltig kategori', async () => {
    (supabaseServer.createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) }
    });

    const req = new NextRequest('http://localhost/api/impact', {
      method: 'POST',
      body: JSON.stringify({ user_id: 'user_123', category: 'invalid_cat' })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid category');
  });
});