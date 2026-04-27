// app/api/test-google/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  // En enkel test-url för att se om nyckeln fungerar
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=Stockholm&destinations=Goteborg&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Kunde inte nå Google" }, { status: 500 });
  }
}