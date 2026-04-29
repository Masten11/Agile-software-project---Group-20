import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify who is making the request
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the new password
    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Tell Supabase Auth to update the password
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}