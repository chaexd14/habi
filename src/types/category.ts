export type Category = {
  id: string;
  user_id?: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
};

export type CategoryResponse = {
  success: boolean;
  message?: string;
  error?: string;
  data: Category[];
};
