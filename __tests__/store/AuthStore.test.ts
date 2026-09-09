/**
 * Tests for store/AuthStore.ts
 * 
 * Zustand user authentication store.
 */

import { useUserStore, User } from "@/store/AuthStore";

describe("AuthStore (useUserStore)", () => {
  // Reset store before each test
  beforeEach(() => {
    useUserStore.setState({ user: null, isAuthenticated: false });
  });

  const mockUser: User = {
    id: "user-123",
    name: "Aryan Rastogi",
    email: "aryan@connecto.com",
    image: "https://example.com/avatar.jpg",
    role: "USER",
  };

  const mockAdmin: User = {
    id: "admin-456",
    name: "Admin User",
    email: "admin@connecto.com",
    role: "ADMIN",
  };

  describe("initial state", () => {
    it("should start with null user", () => {
      const state = useUserStore.getState();
      expect(state.user).toBeNull();
    });

    it("should start as not authenticated", () => {
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("setUser", () => {
    it("should set the user and mark as authenticated", () => {
      useUserStore.getState().setUser(mockUser);
      const state = useUserStore.getState();

      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should set admin user correctly", () => {
      useUserStore.getState().setUser(mockAdmin);
      const state = useUserStore.getState();

      expect(state.user?.role).toBe("ADMIN");
      expect(state.isAuthenticated).toBe(true);
    });

    it("should overwrite previous user", () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().setUser(mockAdmin);
      const state = useUserStore.getState();

      expect(state.user?.id).toBe("admin-456");
      expect(state.user?.name).toBe("Admin User");
    });
  });

  describe("clearUser", () => {
    it("should clear user and mark as unauthenticated", () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().clearUser();
      const state = useUserStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("should be safe to call when already cleared", () => {
      useUserStore.getState().clearUser();
      const state = useUserStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("updateUser", () => {
    it("should partially update user data", () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().updateUser({ name: "New Name" });
      const state = useUserStore.getState();

      expect(state.user?.name).toBe("New Name");
      expect(state.user?.email).toBe("aryan@connecto.com"); // unchanged
    });

    it("should update image", () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().updateUser({ image: "https://new-avatar.com/pic.jpg" });
      const state = useUserStore.getState();

      expect(state.user?.image).toBe("https://new-avatar.com/pic.jpg");
    });

    it("should not crash when user is null", () => {
      useUserStore.getState().updateUser({ name: "Ghost" });
      const state = useUserStore.getState();
      expect(state.user).toBeNull();
    });

    it("should update role from USER to ADMIN", () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().updateUser({ role: "ADMIN" });
      const state = useUserStore.getState();

      expect(state.user?.role).toBe("ADMIN");
    });
  });
});
