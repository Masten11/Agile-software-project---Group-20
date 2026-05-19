import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    //  Verify that the user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch data from the leaderboard view
    const { data: leaderboardData, error } = await supabase
      .from("leaderboard_view")
      .select("*")
      .order("eco_score", { ascending: false })
      .limit(100); // Fetch top 100 users

    if (error) {
      throw error;
    }

    //  Return the data to the frontend
    return NextResponse.json({ 
      success: true, 
      data: leaderboardData 
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Leaderboard API Error:", message);
    
    return NextResponse.json(
      { error: "Failed to load leaderboard data" },
      { status: 500 }
    );
  }
}