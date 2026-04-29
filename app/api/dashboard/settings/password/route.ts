import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify who is making the request
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Vi behöver användarens email för att kunna verifiera nuvarande lösenord
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the passwords
    const body = await request.json();
    const { currentPassword, password } = body;

    // 1. Validera input - Nuvarande lösenord
    if (!currentPassword) {
      return NextResponse.json({ error: "Nuvarande lösenord krävs" }, { status: 400 });
    }

    // 2. Validera input - Nytt lösenord och STYRKA
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Det nya lösenordet måste vara minst 8 tecken" }, { status: 400 });
    }

    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;

    if (score < 2) {
      return NextResponse.json({ error: "Lösenordet är för svagt. Det måste innehålla en blandning av bokstäver, siffror eller symboler." }, { status: 400 });
    }

    // 3. Verifiera det nuvarande lösenordet (Säkerhetsgrinden)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      // Om signInError triggas betyder det att lösenordet var fel
      return NextResponse.json({ error: "Det nuvarande lösenordet är felaktigt" }, { status: 400 });
    }

    // 4. Nu när vi vet att användaren kan sitt nuvarande lösenord, uppdaterar vi det
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}