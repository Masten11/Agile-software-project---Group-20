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
  }
  
  export async function calculateUserEcoScore(
    userId: string,
    supabase: any
  ): Promise<number> {
    // Fetch all activities for this user in chronological order
    const { data: activities, error } = await supabase
      .from('eco_activities')
      .select('id, category, details, co2_kg, water_l, energy_kwh, created_at, day')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
  
    if (error) throw new Error(`Failed to fetch activities: ${error.message}`);

    await supabase
      .from('eco_score_log')
      .delete()
      .eq('user_id', userId);
  
    let runningScore = 500;
    let currentDay: string | null = null;
    let dishwasherCount = 0;
  
    for (const act of activities || []) {
      let bonus = 0;
      let penalty = 0;
  
      // Reset daily counters
      if (currentDay === null || currentDay !== act.day) {
        currentDay = act.day;
        dishwasherCount = 0;
      }
  
      // SHOWER RULES
      if (act.category === 'shower' && act.details?.minutes) {
        const minutes = parseFloat(act.details.minutes);
        if (minutes <= 5) bonus = 5;
        else if (minutes >= 10) penalty = 15;
      }
  
      // DISHWASHER RULES
      if (act.category === 'dishwasher') {
        dishwasherCount += 1;
        if (act.details?.ecoMode === 'true') bonus = 10;
        if (dishwasherCount > 2) penalty += (dishwasherCount - 2) * 5;
      }
  
      // TRANSPORT RULES
      if (act.category === 'transport' && act.details?.transportMode) {
        const mode = act.details.transportMode;
        if (mode === 'bike') bonus = 10;
        else if (mode === 'train' || mode === 'bus') bonus = 5;
        else if (mode === 'plane') penalty = 50;
        else if (mode === 'car') {
          const distance = parseFloat(act.details.distance_km || 0);
          if (distance < 2) penalty = 15;
        }
      }
  
      // Calculate net change
      const environmentalImpact = 
        Math.round(
          (act.co2_kg || 0) * 1 + 
          (act.water_l || 0) * 0.1 + 
          (act.energy_kwh || 0) * 2
        );
  
      const netChange = bonus - penalty - environmentalImpact;
      runningScore += netChange;
  
      // Clamp to 0-1000
      runningScore = Math.max(0, Math.min(1000, runningScore));

      const { error: logError } = await supabase
      .from('eco_score_log')
      .insert({
        user_id: userId,
        activity_id: act.id,
        created_at: act.created_at,
        score: runningScore,
      });

    if (logError) {
      console.error('Failed to log score:', logError);
    }
    }
  
    return runningScore;
  }
  
  // Call this after inserting/updating/deleting activities
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