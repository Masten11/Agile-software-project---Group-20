export type Category = 'co2' | 'water' | 'electricity';

export type EngagingRequestBody = {
  user_id: string;
  category: Category;
};

