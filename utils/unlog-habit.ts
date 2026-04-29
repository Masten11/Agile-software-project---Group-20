import { SupabaseClient } from "@supabase/supabase-js/dist/index.mjs";
import { EmissionNotFoundError } from "./custom-errors";



export async function unlogHabit(
    id: string,
    userId: string,
    supabase: SupabaseClient
  ): Promise<void> {
    const { data: deletedData, error } = await supabase
      .from('emissions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
  
    if (error) {
      throw new Error(error.message);
    }

    if (!deletedData) {
      throw new EmissionNotFoundError();
    }
  }
  