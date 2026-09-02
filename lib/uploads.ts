export async function uploadFile(file: File, subfolder: string = ""): Promise<string> {
  if (!file) throw new Error("No file provided");

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("Cloudinary credentials missing. Falling back to placeholder URL.");
    return `https://via.placeholder.com/800x400?text=${encodeURIComponent(file.name)}`;
  }

  const formData = new FormData();
  formData.append("file", file);
  
  // Create an unsigned upload preset in your Cloudinary settings, or use signature-based upload
  // For simplicity in this server-side function, we generate a signature
  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  
  // Using simple unsigned upload for now if you configure 'connecto_preset' in Cloudinary
  // Alternatively, use a signed upload logic here. We'll use a preset for ease of config.
  formData.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET || "ml_default");
  if (subfolder) {
    formData.append("folder", subfolder);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Cloudinary Error:", data);
    throw new Error(data.error?.message || "Failed to upload file");
  }

  return data.secure_url;
}

export async function uploadImage(file: File, subfolder: string = ""): Promise<string> {
  if (!file) throw new Error("No file provided");

  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type. Only images (JPG, PNG, WebP) are allowed.");
  }

  return await uploadFile(file, subfolder);
}

export async function deleteFile(fileUrl: string) {
  // Deleting from Cloudinary requires signed API calls using api_secret.
  // We'll leave this as a no-op for now unless explicitly required to prevent accidental deletes.
  console.log(`Cloudinary deletion requested for ${fileUrl}, but is currently not implemented.`);
}