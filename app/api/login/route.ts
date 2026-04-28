// app/api/login/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";


export async function POST(request: Request) {
  try {
    // Parse the JSON body from the client request
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Call Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Return the successful data
    return NextResponse.json({ data }, { status: 200 });
    
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}