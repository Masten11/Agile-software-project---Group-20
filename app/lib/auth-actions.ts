// lib/auth-actions.ts
import { supabase } from "@/utils/supabase";

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
}; // <--- Se till att denna måsvinge finns och stänger funktionen!

// Funktion 2: SignUp
export const handleSignUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};