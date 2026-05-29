import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChatClient from "@/components/chat/chat-client";

export default async function ChatPage({ params }: { params: Promise<{ targetUserId: string }> }) {
  const { user } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { targetUserId } = await params;

  if (user.id === targetUserId) {
    redirect("/profile/connections");
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <ChatClient 
        currentUserId={user.id} 
        targetUserId={targetUserId} 
      />
    </div>
  );
}