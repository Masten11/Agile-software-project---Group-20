// lib/scoring.ts
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
const MAX_ECO_SCORE = 20;    // c: maximum reward/penalty from environmental impact

export async function calculateAndLogUserEcoScore(
  userId: string,
  supabase: any
): Promise<number> {
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

    // Återställ räknare om det är en ny dag i loopen
    if (currentDay === null || currentDay !== act.day) {
      currentDay = act.day;
      dishwasherCount = 0;
    }

    // SHOWER RULES
    if (act.category === 'shower' && act.details?.minutes) {
      const minutes = parseFloat(act.details.minutes);
      if (minutes <= 5) bonus = 10;
      else if (minutes >= 15) penalty = 15;
    }

    // DISHWASHER RULES
    if (act.category === 'dishwasher') {
      dishwasherCount += 1;
      if (act.details?.ecoMode === 'true') bonus = 10;
      if (dishwasherCount > 2) penalty += (dishwasherCount - 2) * 5;
    }
    
    // WASHING MACHINE RULES
    if (act.category === 'washingmachine') {
      if (act.details?.ecoMode === true) bonus += 10;

      const temperature = parseFloat(act.details?.temperatureCelsius || 0);
      if (temperature <= 30) bonus += 5;
      else if (temperature >= 60) penalty += 10;
    }

    // CLOTHES RULES
    if (act.category === 'clothes') {
      const material = act.details?.material;
      const productionRegion = act.details?.productionRegion;

      if (material === 'recycled_polyester') {
        bonus += 15;
      }

      if (productionRegion === 'local') {
        bonus += 5;
      } else if (productionRegion === 'asia' || productionRegion === 'other') {
        penalty += 5;
      }
    }

    // TRANSPORT RULES
    if (act.category === 'transport' && act.details?.transportMode) {
      const mode = act.details.transportMode;
      if (mode === 'bike') bonus = 15;
      else if (mode === 'train' || mode === 'bus' || mode === 'electric_bus')  bonus = 10;
      else if (mode === 'car') {
        const distance = parseFloat(act.details.distance_km || 0);
        if (distance < 2) penalty = 10;
      }
    }

    // Calculate raw environmental impact (combined metrics)
    const rawImpact = 
      (act.co2_kg || 0) * 1 + 
      (act.water_l || 0) * 0.05 + 
      (act.energy_kwh || 0) * 1;

    // Apply piecewise logarithmic function based on breakpoint
    let environmentalImpactScore: number;

    if (rawImpact >= BREAKPOINT) {
      // Negative impact zone: f(x) = -c * log10(x - (b-1))
      // This penalizes high-impact activities logarithmically
      environmentalImpactScore = -MAX_ECO_SCORE * Math.log10(rawImpact - (BREAKPOINT - 1));
    } else {
      // Positive impact zone: g(x) = (c / log10(b+1)) * log10(-x + 5 + 1)
      // This rewards low-impact activities, with maximum reward at x=0
      environmentalImpactScore = 
        (MAX_ECO_SCORE / Math.log10(BREAKPOINT + 1)) * 
        Math.log10(-rawImpact + 5 + 1);
    }

    // Calculate net change with bonuses, penalties, and environmental impact score
    const netChange = bonus - penalty + Math.round(environmentalImpactScore);
    runningScore += netChange;

    // Clamp to 0-1000
    runningScore = Math.max(0, Math.min(1000, runningScore));

    dailyScores[act.day] = runningScore;
  }
  
  const upsertData = Object.entries(dailyScores).map(([day, score]) => ({
    user_id: userId,
    score: score,
    day: day,
    created_at: new Date().toISOString()
  }));

  //Spara alla dagliga resultat i eco_score_log
  if (upsertData.length > 0) {
    const { error: upsertError } = await supabase
      .from('eco_score_log')
      .upsert(upsertData, { 
        onConflict: 'user_id, day' // Om dagen redan finns, skriv över scoren!
      });

    if (upsertError) throw new Error(`Failed to log daily scores: ${upsertError.message}`);
  }

// Uppdatera användarens nuvarande poäng i profiles
const { error: profileError } = await supabase
  .from('profiles')
  .update({ eco_score: runningScore })
  .eq('id', userId);

if (profileError) throw new Error(`Failed to update profile: ${profileError.message}`);

  return runningScore;
}