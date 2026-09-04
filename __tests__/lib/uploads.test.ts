/**
 * Tests for lib/uploads.ts
 * 
 * File upload utilities.
 */

import { uploadFile, uploadImage, deleteFile } from "@/lib/uploads";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("uploadFile", () => {
  afterEach(() => {
    mockFetch.mockReset();
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  it("should throw error when no file provided", async () => {
    await expect(uploadFile(null as any)).rejects.toThrow("No file provided");
  });

  it("should return placeholder URL when Cloudinary credentials are missing", async () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    const url = await uploadFile(file);
    expect(url).toContain("via.placeholder.com");
    expect(url).toContain("test.pdf");
  });

  it("should call Cloudinary API when credentials are set", async () => {
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-key";
    process.env.CLOUDINARY_API_SECRET = "test-secret";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ secure_url: "https://res.cloudinary.com/test/file.pdf" }),
    });

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    const url = await uploadFile(file);
    expect(url).toBe("https://res.cloudinary.com/test/file.pdf");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should throw error when Cloudinary returns error", async () => {
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-key";
    process.env.CLOUDINARY_API_SECRET = "test-secret";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: "Upload failed" } }),
    });

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    await expect(uploadFile(file)).rejects.toThrow("Upload failed");
  });
});

describe("uploadImage", () => {
  afterEach(() => {
    mockFetch.mockReset();
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  it("should throw error when no file provided", async () => {
    await expect(uploadImage(null as any)).rejects.toThrow("No file provided");
  });

  it("should throw error for non-image file types", async () => {
    const file = new File(["content"], "doc.pdf", { type: "application/pdf" });
    await expect(uploadImage(file)).rejects.toThrow("Invalid file type");
  });

  it("should accept image files", async () => {
    const file = new File(["image-data"], "photo.jpg", { type: "image/jpeg" });
    // Without Cloudinary creds, should return placeholder
    const url = await uploadImage(file);
    expect(url).toContain("via.placeholder.com");
  });
});

describe("deleteFile", () => {
  it("should not throw (no-op implementation)", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    await expect(deleteFile("https://example.com/file.jpg")).resolves.toBeUndefined();
    consoleSpy.mockRestore();
  });
});
