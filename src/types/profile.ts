export type UserProfile = {
  id: string;
  user_name: string;
  avatar_url: string;
  role: "ADMIN" | "USER";
  timezone: string;
};

export type UserProfileResponse = {
  success: boolean;
  message: string;
  data: UserProfile[];
};

export type Profile = {
  id: string;
  full_name: string;
  timezone: string;
  updated_at: string;
};

export type ProfileFormData = {
  full_name: string;
  timezone: string;
};

