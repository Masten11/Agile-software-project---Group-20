import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    // Unpack the data sent from the browser
    const body = await request.json();
    const { email, password, firstName, lastName, username } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validera lösenordsstyrka på servern
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;

    if (score < 2) {
      return NextResponse.json(
        { error: "Please choose a stronger password." },
        { status: 400 }
      );
    }

    // Rebuild custom metadata logic
    const metaData: Record<string, string> = {};
    
    if (firstName?.trim()) metaData.first_name = firstName.trim();
    if (lastName?.trim()) metaData.last_name = lastName.trim();
    
    if (username?.trim()) {
      metaData.username = username.trim();
    } else {
      // Genererar 4 slumpmässiga siffror från 0000 till 9999
      const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      metaData.username = `user${randomDigits}`;
    }

    const supabase = await createClient();
    // Call Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metaData
      }
    });

    // Handle Supabase errors
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return success
    return NextResponse.json({ data }, { status: 200 });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}