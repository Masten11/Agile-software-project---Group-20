import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function DELETE() {
  try {
    const supabase = await createClient();

    // Check logged in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete activities
    await supabase
      .from("eco_activities")
      .delete()
      .eq("user_id", user.id);

    // Delete profile
    await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    // Sign out session
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Account data deleted."
    });

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Server error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}