import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#EEF3F8] flex flex-col">
      <ScrollReveal direction="down">
        <header className="sticky top-0 z-50 border-b bg-white">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Connecto</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Sign in
              </Link>
              <Link href="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700">Join now</Button>
              </Link>
            </div>
          </div>
        </header>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.2} className="flex-1 flex flex-col">
        <main className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900">
              Welcome to your <span className="text-blue-600">professional community</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Connect with businesses, find investors, and explore the marketplace. Join Connecto today to grow your network.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg h-14 px-8 rounded-full">
                  Get started for free
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </ScrollReveal>
    </div>
  );
}