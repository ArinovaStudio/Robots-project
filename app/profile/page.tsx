import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/home/navbar";
import FeedCard from "@/components/home/feed-card";
import SuggestedProfiles from "@/components/SuggestedProfiles";

export default function ProfilePage() {
  const stats = [
    { label: "Profile Views", value: "1,284", color: "text-red-500" },
    { label: "Post Impressions", value: "18.2K", color: "text-emerald-500" },
    { label: "Connections", value: "324", color: "text-blue-500" },
  ];

  const skills = ["UI/UX", "Next.js", "Tailwind", "Framer Motion", "Branding"];

  const posts = [1, 2];

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-3 px-3 py-3 lg:grid-cols-12">
        <aside className="sticky top-16 self-start space-y-3 lg:col-span-3">
          <div className="rounded-lg border border-black/[0.06] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400" />
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>

                <button className="absolute bottom-0 right-0 rounded-full border border-black/10 bg-white p-2 shadow-sm transition hover:scale-105">
                  ✎
                </button>
              </div>

              <h2 className="mt-5 text-base font-medium">Aarav Sharma</h2>
              <p className="mt-1 text-sm text-[#667085]">
                Product Designer • Level 3
              </p>

              <p className="mt-5 text-xs leading-7 text-[#475467]">
                Building modern digital experiences with strong visual systems,
                interaction design, and scalable frontend development.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-black/[0.06] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h3 className="text-base font-medium">Profile Stats</h3>

            <div className="mt-7 space-y-5">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-[#475467]">{item.label}</span>
                  <span className={`text-xs font-medium ${item.color}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-black/[0.06] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h3 className="text-base font-medium">Skills</h3>

            <div className="mt-5 flex flex-wrap gap-3">
              {skills.map((skill) => (
                <div
                  key={skill}
                  className="rounded-full border border-black/5 bg-[#f7f7f8] px-4 py-2 text-xs font-medium"
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-5 lg:col-span-6">
          <div className="rounded-lg border border-black/[0.06] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-start justify-between gap-4 max-sm:flex-col">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  Personal Profile
                </h2>
                <p className="mt-2 text-[#667085]">
                  Manage your public information and portfolio visibility.
                </p>
              </div>

              <Button className="rounded-lg">Save Changes</Button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-xs font-medium text-[#344054]">
                  Full Name
                </label>
                <Input
                  defaultValue="Aarav Sharma"
                  className="h-11 border-black/5 bg-[#f8f8f8]"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs font-medium text-[#344054]">
                  Username
                </label>
                <Input
                  defaultValue="@aaravdesigns"
                  className="h-11 border-black/5 bg-[#f8f8f8]"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs font-medium text-[#344054]">
                  Email
                </label>
                <Input
                  defaultValue="aarav@studio.com"
                  className="h-11 border-black/5 bg-[#f8f8f8]"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs font-medium text-[#344054]">
                  Location
                </label>
                <Input
                  defaultValue="West Bengal, India"
                  className="h-11 border-black/5 bg-[#f8f8f8]"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-3 block text-xs font-medium text-[#344054]">
                Bio
              </label>

              <Textarea className="min-h-[120px] border-black/5 bg-[#f8f8f8]" />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <button className="rounded-xl border border-black/5 bg-[#f8f8f8] px-4 py-4 text-left transition hover:border-black/10 hover:bg-white">
                <p className="text-sm font-bold">Upload Resume</p>
                <span className="mt-1 block text-xs text-[#667085]">
                  PDF / DOCX
                </span>
              </button>

              <button className="rounded-xl border border-black/5 bg-[#f8f8f8] px-4 py-4 text-left transition hover:border-black/10 hover:bg-white">
                <p className="text-sm font-bold">Portfolio</p>
                <span className="mt-1 block text-xs text-[#667085]">
                  Add Behance or Dribbble
                </span>
              </button>

              <button className="rounded-xl border border-black/5 bg-[#f8f8f8] px-4 py-4 text-left transition hover:border-black/10 hover:bg-white">
                <p className="text-sm font-bold">Social Links</p>
                <span className="mt-1 block text-xs text-[#667085]">
                  Connect profiles
                </span>
              </button>
            </div>
          </div>
        </section>

        <aside className="sticky top-16 self-start space-y-3 lg:col-span-3">
          <SuggestedProfiles />

          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[2rem] border border-black/5 bg-white p-7 text-center shadow-sm">
            <div className="rounded-full bg-[#f5f5f5] p-4 text-3xl">🔒</div>

            <h3 className="mt-5 text-base font-medium">Premium Insights</h3>
            <p className="mt-3 max-w-[240px] text-[#667085]">
              Unlock advanced analytics, profile reach, and hiring visibility.
            </p>

            <Button className="mt-5 rounded-full bg-black px-6 py-3 text-xs font-medium text-white">
              Upgrade
            </Button>
          </div>
        </aside>
      </main>
    </div>
  );
}
