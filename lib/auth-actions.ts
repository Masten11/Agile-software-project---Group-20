// lib/auth-actions.ts
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

export const handleSignUp = async (email: string, password: string, firstName: string, lastName: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
       
        data: {
          first_name: firstName,
          last_name: lastName,
          username: username,
        }
      }
    });
  
    if (error) throw error;
    return data;
  };