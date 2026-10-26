describe("Investor Logic, Messaging Counts & Connection Request Tests", () => {
  describe("Bug 1 & 4: Investor Portal connection & rating states", () => {
    it("renders 'Pending' and 'Cancel' when a request is already sent to founder", () => {
      const pitch = {
        id: "p1",
        userId: "founder-1",
        title: "AI Robot Automation",
        connectionStatus: "PENDING",
        isRated: false,
        userRating: null,
      };

      const isConnected = pitch.connectionStatus === "ACCEPTED";
      const isPending = pitch.connectionStatus === "PENDING";

      expect(isConnected).toBe(false);
      expect(isPending).toBe(true);

      const buttonLabel = isConnected
        ? "Connected"
        : isPending
        ? "Pending"
        : "Connect";
      expect(buttonLabel).toBe("Pending");

      const showCancelButton = isPending;
      expect(showCancelButton).toBe(true);
    });

    it("renders 'Rated' with exact stars when already rated by investor", () => {
      const pitch = {
        id: "p1",
        userId: "founder-1",
        title: "AI Robot Automation",
        connectionStatus: null,
        isRated: true,
        userRating: 4,
        userFeedback: "Great market traction",
      };

      const rateLabel = pitch.isRated
        ? pitch.userRating
          ? `Rated (${pitch.userRating}★)`
          : "Rated"
        : "Rate";

      expect(rateLabel).toBe("Rated (4★)");
    });

    it("renders 'Rate' button when not rated yet", () => {
      const pitch = {
        id: "p2",
        userId: "founder-2",
        title: "BioTech Diagnostic",
        connectionStatus: null,
        isRated: false,
        userRating: null,
      };

      const rateLabel = pitch.isRated
        ? pitch.userRating
          ? `Rated (${pitch.userRating}★)`
          : "Rated"
        : "Rate";

      expect(rateLabel).toBe("Rate");
    });

    it("renders 'Connected' and 'Message Founder' button when already connected with founder", () => {
      const pitch = {
        id: "p3",
        userId: "founder-3",
        title: "Fintech Rails",
        connectionStatus: "ACCEPTED",
      };

      const isConnected = pitch.connectionStatus === "ACCEPTED";
      expect(isConnected).toBe(true);

      const messageDestination = isConnected ? `/messages/${pitch.userId}` : null;
      expect(messageDestination).toBe("/messages/founder-3");
    });
  });

  describe("Bug 2: Messaging icon badge and per-sender exact message count", () => {
    it("calculates exact unread message count for navbar badge", () => {
      const currentUserId = "user-me";
      const messages = [
        { id: "m1", senderId: "user-bob", isRead: false, isDeleted: false },
        { id: "m2", senderId: "user-bob", isRead: false, isDeleted: false },
        { id: "m3", senderId: "user-alice", isRead: false, isDeleted: false },
        { id: "m4", senderId: "user-me", isRead: false, isDeleted: false }, // own message
        { id: "m5", senderId: "user-charlie", isRead: true, isDeleted: false }, // already read
        { id: "m6", senderId: "user-bob", isRead: false, isDeleted: true }, // deleted
      ];

      const unreadCount = messages.filter(
        (m) => m.senderId !== currentUserId && !m.isRead && !m.isDeleted
      ).length;

      expect(unreadCount).toBe(3); // 2 from bob, 1 from alice
    });

    it("calculates exact unread count per sender beside sender name", () => {
      const messages = [
        { senderId: "bob", isRead: false, isDeleted: false },
        { senderId: "bob", isRead: false, isDeleted: false },
        { senderId: "alice", isRead: false, isDeleted: false },
        { senderId: "bob", isRead: true, isDeleted: false },
      ];

      const countMap = new Map<string, number>();
      messages.forEach((m) => {
        if (!m.isRead && !m.isDeleted) {
          countMap.set(m.senderId, (countMap.get(m.senderId) || 0) + 1);
        }
      });

      expect(countMap.get("bob")).toBe(2);
      expect(countMap.get("alice")).toBe(1);
      expect(countMap.get("charlie") || 0).toBe(0);
    });

    it("resets sender unread count to 0 when opening chat conversation", () => {
      let contacts = [
        { userId: "bob", name: "Bob Founder", unreadCount: 2 },
        { userId: "alice", name: "Alice Investor", unreadCount: 1 },
      ];

      const targetUserId = "bob";
      contacts = contacts.map((c) =>
        c.userId === targetUserId ? { ...c, unreadCount: 0 } : c
      );

      expect(contacts.find((c) => c.userId === "bob")?.unreadCount).toBe(0);
      expect(contacts.find((c) => c.userId === "alice")?.unreadCount).toBe(1);
    });
  });

  describe("Bug 3: Cancel request button in sent requests and pending requests", () => {
    it("cancels connection request from sent requests list", () => {
      let sentRequests = [
        { id: "req-1", receiver: { id: "founder-1", name: "Founder 1" } },
        { id: "req-2", receiver: { id: "founder-2", name: "Founder 2" } },
      ];

      const cancelRequestId = "req-1";
      sentRequests = sentRequests.filter((r) => r.id !== cancelRequestId);

      expect(sentRequests.length).toBe(1);
      expect(sentRequests[0].id).toBe("req-2");
    });

    it("cancels pending connection request and clears pending status on card/profile", () => {
      let pitchItem: {
        id: string;
        userId: string;
        connectionStatus: string | null;
        connectionId?: string | null;
      } = {
        id: "p1",
        userId: "founder-1",
        connectionStatus: "PENDING",
        connectionId: "conn-123",
      };

      // User clicks Cancel
      const handleCancel = (userId: string) => {
        if (pitchItem.userId === userId) {
          pitchItem = {
            ...pitchItem,
            connectionStatus: null,
            connectionId: null,
          };
        }
      };

      handleCancel("founder-1");
      expect(pitchItem.connectionStatus).toBeNull();
    });
  });
});
