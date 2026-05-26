/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/eco-score.ts

export interface EcoActivity {
  id: string;
  user_id: string;
  category: string;
  details: Record<string, any>;
  co2_kg: number;
  water_l: number;
  energy_kwh: number;
  created_at: string;
  day: string;
}

// Configuration constants for the logarithmic scoring algorithm
const BREAKPOINT = 20;        // b: threshold where function switches (tune based on your data)
const MAX_ECO_SCORE = 30;    // c: maximum reward/penalty from environmental impact

// 1. ONLY Calculates (No Database Writes)
export async function calculateUserEcoScore(
  userId: string,
  supabase: any
): Promise<{ currentScore: number; dailyScores: Record<string, number> }> {
  // Fetch all activities for this user in chronological order
  const { data: activities, error } = await supabase
    .from('eco_activities')
    .select('id, category, details, co2_kg, water_l, energy_kwh, created_at, day')
    .eq('user_id', userId)
    .order('day', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch activities: ${error.message}`);

  let runningScore = 500;
  let currentDay: string | null = null;
  let dishwasherCount = 0;

  const dailyScores: Record<string, number> = {};

  for (const act of activities || []) {
    let bonus = 0;
    let penalty = 0;

    // Reset counters if it's a new day in the loop
    if (currentDay === null || currentDay !== act.day) {
      currentDay = act.day;
      dishwasherCount = 0;
    }

    // Calculate raw environmental impact (combined metrics)
    const rawImpact = (act.co2_kg || 0) * 1 + (act.water_l || 0) * 0.05 + (act.energy_kwh || 0) * 1;

    let environmentalImpactScore: number;
    if (rawImpact >= BREAKPOINT) {
      // Negative impact zone
      environmentalImpactScore = -MAX_ECO_SCORE * Math.log10(rawImpact - (BREAKPOINT - 1));
    } else {
      // Positive impact zone
      const safeLogInput = Math.max(1, -rawImpact + 5 + 1); 
      environmentalImpactScore = (MAX_ECO_SCORE / Math.log10(BREAKPOINT + 1)) * Math.log10(safeLogInput);
    }

    // Calculate net change
    const netChange = bonus - penalty + Math.round(environmentalImpactScore);
    runningScore += netChange;

    // Clamp to 0-1000
    runningScore = Math.max(0, Math.min(1000, runningScore));
    dailyScores[act.day] = runningScore;
  }
  
  return { currentScore: runningScore, dailyScores };
}

// 2. ONLY Logs Daily Scores (Database Write)
export async function logDailyScores(
  userId: string,
  dailyScores: Record<string, number>,
  supabase: any
) {
  const upsertData = Object.entries(dailyScores).map(([day, score]) => ({
    user_id: userId,
    score: score,
    day: day,
    created_at: new Date().toISOString()
  }));

  if (upsertData.length > 0) {
    const { error } = await supabase
      .from('eco_score_log')
      .upsert(upsertData, { onConflict: 'user_id, day' });

    if (error) throw new Error(`Failed to log daily scores: ${error.message}`);
  }
}

// 3. ONLY Updates Profile (Database Write)
export async function updateUserProfile(
  userId: string,
  ecoScore: number,
  supabase: any
) {
  const { error } = await supabase
    .from('profiles')
    .update({ eco_score: ecoScore })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
}