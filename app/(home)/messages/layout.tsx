import ContactListSidebar from "@/components/chat/contact-list-sidebar";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-120px)] bg-transparent overflow-hidden">
      
      {/* Left Side */}
      <div className="w-full md:w-[350px] flex-shrink-0">
        <ContactListSidebar />
      </div>

      {/* Right Side */}
      <div className="flex-1 flex flex-col relative overflow-hidden py-4 pr-4">
        {children}
      </div>
      
    </div>
  );
}