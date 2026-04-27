import { supabase } from "@/lib/supabase";

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

export const handleSignUp = async (
  email: string, 
  password: string, 
  firstName?: string, 
  lastName?: string, 
  username?: string
) => {
  
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metaData
    }
  });

  if (error) throw error;
  return data;
};