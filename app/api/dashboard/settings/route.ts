import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

//Fetch the user's profile data on page load
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get logged-in user securely
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //  Fetch their custom profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Return everything to the frontend
    return NextResponse.json({
      userId: user.id,
      email: user.email || "",
      profile: profile || null,
    }, { status: 200 });

  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

// Save changes to the user's profile
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify who is making the request
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the incoming data
    const body = await request.json();
    const { firstName, lastName, username, activeGradient } = body;

    // Update the database
    const { error } = await supabase.from("profiles").update({
      first_name: firstName,
      last_name: lastName,
      username: username,
      avatar_gradient: activeGradient,
    }).eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}