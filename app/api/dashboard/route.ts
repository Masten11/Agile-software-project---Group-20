// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { calculateUserStreak } from "@/lib/streak";

export async function GET() {
  try {
    const supabase = await createClient();

    // Authenticate the user securely via cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //  Fetch the user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, eco_score")
      .eq("id", user.id)
      .single();

    //Fetch today's activities
    const today = new Date().toISOString().split("T")[0];
    const { data: activities } = await supabase
      .from("eco_activities")
      .select("category, co2_kg")
      .eq("user_id", user.id)
      .eq("day", today);
   

    //  Calculate Streak   
    const streak = await calculateUserStreak(supabase, user.id);

    // Send all the data back as one neat package
    return NextResponse.json({
      firstName: profile?.first_name || "USER",
      activities: activities || [],
      ecoScore: profile?.eco_score ?? 500, // Return the score
      streak: streak
    }, { status: 200 });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}