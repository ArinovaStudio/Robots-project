export async function uploadFile(file: File, subfolder: string = ""): Promise<string> {
  if (!file) throw new Error("No file provided");

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const targetDir = path.join(process.cwd(), "public", "uploads", subfolder);
      await fs.mkdir(targetDir, { recursive: true });

      const sanitizedFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(targetDir, sanitizedFilename);
      await fs.writeFile(filePath, buffer);

      return `/uploads/${subfolder ? subfolder + "/" : ""}${sanitizedFilename}`;
    } catch (err) {
      console.warn("Local upload fallback failed:", err);
      return `https://via.placeholder.com/800x400?text=${encodeURIComponent(file.name)}`;
    }
  }

  const formData = new FormData();
  formData.append("file", file);
  
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