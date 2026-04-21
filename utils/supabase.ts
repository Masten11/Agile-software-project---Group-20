import { createBrowserClient } from '@supabase/ssr'

// Vi skapar en klient som hämtar nycklarna direkt från din .env.local fil
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
