import { supabase } from "@/lib/supabase";

// Funktion 1: Login
export const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}; 

// Funktion 2: Sign Up (Optimerad för Progressive Onboarding)
export const handleSignUp = async (
  email: string, 
  password: string, 
  firstName?: string, 
  lastName?: string, 
  username?: string
) => {
  
  // Bygg metadata-objektet dynamiskt. 
  // Lägger bara till nycklarna om fälten inte är tomma strängar.
  const metaData: Record<string, string> = {};
  
  if (firstName?.trim()) metaData.first_name = firstName.trim();
  if (lastName?.trim()) metaData.last_name = lastName.trim();
  if (username?.trim()) metaData.username = username.trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: Object.keys(metaData).length > 0 ? metaData : undefined
    }
  });

  if (error) throw error;
  return data;
};