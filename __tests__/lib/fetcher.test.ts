/**
 * Tests for lib/fetcher.ts
 * 
 * The SWR/fetch wrapper utility.
 */

import { fetcher } from "@/lib/fetcher";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("fetcher", () => {
  afterEach(() => {
    mockFetch.mockReset();
  });

  it("should return data on successful response", async () => {
    const mockData = { success: true, data: [{ id: 1 }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await fetcher("/api/test");
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith("/api/test");
  });

  it("should throw error on failed response with message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Not found" }),
    });

    await expect(fetcher("/api/missing")).rejects.toThrow("Not found");
  });

  it("should throw default error when no message in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    await expect(fetcher("/api/error")).rejects.toThrow("Failed to fetch");
  });

  it("should pass the URL correctly to fetch", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await fetcher("/api/auth/me");
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/me");
  });
});
