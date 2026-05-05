export async function getWeeklyUsage(
    supabase: any,
    userId: string,
    viewName: string,
    totalColumn: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from(viewName)
      .select(totalColumn)
      .eq('user_id', userId)
      .maybeSingle();
  
    if (error) {
      throw new Error('Could not fetch usage data');
    }
  
    return Number(data?.[totalColumn] ?? 0);
  }