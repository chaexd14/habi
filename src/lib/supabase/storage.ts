import createClient from "@/lib/supabase/client";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function uploadAvatarFile(file: File): Promise<string> {
  if (!file) {
    throw new Error("No file provided.");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload JPEG, PNG, WEBP, or GIF."
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File size exceeds the 5 MB limit.");
  }

  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to upload an avatar.");
  }

  const extension =
    file.name.split(".").pop()?.toLowerCase() || "jpg";

  const fileName = `avatar-${crypto.randomUUID()}.${extension}`;

  const filePath = `${user.id}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("user_image")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error("Avatar upload failed:", error);
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from("user_image")
    .getPublicUrl(data.path);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Failed to generate avatar URL.");
  }

  return publicUrlData.publicUrl;
}
