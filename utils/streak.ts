import { SupabaseClient } from "@supabase/supabase-js";

export async function calculateUserStreak(supabase: SupabaseClient, userId: string): Promise<number> {
    const { data: history } = await supabase
    .from("eco_activities")
    .select("day")
    .eq("user_id", userId)
    .order("day", { ascending: false });

  let streak = 0;

  if (history && history.length > 0) {
    // Extract unique dates directly
    const uniqueDates = Array.from(new Set(history.map((row) => row.day)));

    // Helper to generate YYYY-MM-DD for offsets
    const getOffsetDate = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      // Ensure local timezone formatting aligns with your frontend expectations
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().split("T")[0];
    };

    const today = getOffsetDate(0);
    const yesterday = getOffsetDate(1);

    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      let offset = uniqueDates.includes(today) ? 0 : 1;
      
      while (uniqueDates.includes(getOffsetDate(offset))) {
        streak++;
        offset++;
      }
    }
  }
  return streak;
}