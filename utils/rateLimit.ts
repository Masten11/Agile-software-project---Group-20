import { SupabaseClient } from '@supabase/supabase-js';
import { Category } from './habit-types';

interface RateLimitConfig {
  table: string;
  timestampColumn: string;
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  isLimited: boolean;
  count: number;
  maxRequests: number;
}

const RATE_LIMIT_CONFIG: Record<Category, RateLimitConfig> = {
  [Category.Transportation]: {
    table: 'eco_activities', // <-- Ändrad till din faktiska databastabell
    timestampColumn: 'created_at',
    maxRequests: 100,
    windowMs: 24 * 60 * 60 * 1000,
  }
};

export function hasRateLimitConfig(category: Category): boolean {
  return Boolean(RATE_LIMIT_CONFIG[category]);
}

export async function rateLimitByCategory(
  supabase: SupabaseClient,
  userId: string,
  category: Category,
  now: Date = new Date()
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIG[category];
  if (!config) {
    return {
      isLimited: false,
      count: 0,
      maxRequests: Number.POSITIVE_INFINITY,
    };
  }
  const windowStart = new Date(now.getTime() - config.windowMs).toISOString();

  const { count, error } = await supabase
    .from(config.table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('category', category) // <-- VIKTIG FIX: Eftersom alla vanor delar tabell, måste vi filtrera på kategorin!
    .gte(config.timestampColumn, windowStart);

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  const resolvedCount = count ?? 0;

  return {
    isLimited: resolvedCount >= config.maxRequests,
    count: resolvedCount,
    maxRequests: config.maxRequests,
  };
}