"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, Briefcase, Search, ShoppingBag, Users, BarChart3,
  Building2, Handshake, UserPlus, Rocket, Network, Star,
  TrendingUp, Globe, Zap, Shield, CheckCircle2, ChevronRight
} from "lucide-react";

/* ────────────── Shared animation class helpers ────────────── */
const ease = "transition-all duration-300";

/* ───────────────────────── Navbar ───────────────────────── */
function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/25 group-hover:shadow-blue-600/40 group-hover:scale-105 ${ease}`}>
              <span className="text-base font-extrabold text-white tracking-tight">C</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">Connecto</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {["Features", "How it works", "Pricing"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="rounded-full px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                {l}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className={`hidden sm:inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 ${ease}`}>
            Log in
          </Link>
          <Link href="/signup"
            className={`inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/35 hover:-translate-y-0.5 active:translate-y-0 ${ease}`}>
            Get started <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ───────────────── CSS Dashboard Mockup ───────────────── */
function DashboardMockup() {
  const cards = [
    { name: "TechNova", tag: "Technology", color: "bg-blue-100 text-blue-700" },
    { name: "BuildCraft", tag: "Construction", color: "bg-green-100 text-green-700" },
    { name: "PrintX", tag: "Manufacturing", color: "bg-purple-100 text-purple-700" },
  ];
  return (
    <div className="relative w-full max-w-[900px] mx-auto">
      {/* Glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-200/60 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-blue-600/15 blur-2xl rounded-full" />

      {/* Browser frame */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-300/40">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="mx-auto flex h-6 w-56 items-center gap-2 rounded-md bg-white border border-gray-200 px-3">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-[10px] text-gray-400 font-medium">connecto.app/explore</span>
          </div>
        </div>

        {/* Mock dashboard layout */}
        <div className="flex bg-[#F3F2EF] min-h-[340px]">
          {/* Left sidebar */}
          <div className="hidden sm:flex w-52 shrink-0 flex-col gap-3 bg-white border-r border-gray-100 p-4">
            <div className="flex items-center gap-2 pb-3 mb-1 border-b border-gray-100">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">TN</div>
              <div>
                <div className="text-xs font-bold text-gray-800">TechNova</div>
                <div className="text-[10px] text-gray-400">Startup</div>
              </div>
            </div>
            {["Home", "Network", "Messages", "Search"].map((item, i) => (
              <div key={item} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold ${i === 0 ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}>
                <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-blue-600" : "bg-gray-300"}`} />
                {item}
              </div>
            ))}
          </div>

          {/* Main feed */}
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            {cards.map((card) => (
              <div key={card.name} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-extrabold shrink-0">
                  {card.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{card.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${card.color}`}>{card.tag}</span>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    {[...Array(4)].map((_, i) => <div key={i} className={`h-1.5 rounded-full ${i === 0 ? "bg-blue-600 w-16" : "bg-gray-200 w-8"}`} />)}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-blue-600 border border-blue-200 rounded-full px-2.5 py-1 shrink-0">Connect</div>
              </div>
            ))}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[["142", "Connections"], ["28", "Followers"], ["6", "Pending"]].map(([n, l]) => (
                <div key={l} className="bg-white border border-gray-100 rounded-xl p-2.5 text-center shadow-sm">
                  <div className="text-sm font-extrabold text-gray-900">{n}</div>
                  <div className="text-[9px] text-gray-400 font-semibold">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar mini */}
          <div className="hidden lg:flex w-44 shrink-0 flex-col gap-2 border-l border-gray-100 bg-white p-3">
            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-1 mb-1">Suggested</div>
            {["BuildCraft", "PrintX", "Elevate"].map((name) => (
              <div key={name} className="flex items-center gap-2 rounded-lg p-1.5">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                  {name.charAt(0)}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-800">{name}</div>
                  <div className="text-[9px] text-blue-500 font-semibold">+ Follow</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Hero ───────────────────────── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-28 pb-16 lg:pt-40 lg:pb-24">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f7ff_1px,transparent_1px),linear-gradient(to_bottom,#f0f7ff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,#000_40%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/8 rounded-full blur-3xl" />

      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center px-5 sm:px-8 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
          </span>
          <span className="text-sm font-semibold text-blue-700">Now live — The #1 B2B Networking Platform</span>
        </div>

        {/* Headline */}
        <h1 className="mb-6 max-w-5xl text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
          The network that <br className="hidden sm:block" />
          <span className="relative">
            <span className="relative z-10 text-blue-600">works for business.</span>
            <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-100 -z-0 rounded" />
          </span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
          Connect with industry partners, discover B2B opportunities, and scale your business — all on one powerful platform built for modern companies.
        </p>

        {/* CTAs */}
        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
          <Link href="/signup"
            className={`inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 ${ease}`}>
            Start for free — no credit card
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/login"
            className={`inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 shadow-sm hover:border-gray-400 hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0 ${ease}`}>
            Sign in to your account
          </Link>
        </div>

        {/* Social proof */}
        <div className="mb-16 flex items-center gap-6 text-sm text-gray-500">
          <div className="flex -space-x-2">
            {["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500"].map((c, i) => (
              <div key={i} className={`h-8 w-8 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                {["T", "B", "P", "E"][i]}
              </div>
            ))}
          </div>
          <span>Trusted by <strong className="text-gray-800 font-bold">2,500+</strong> companies worldwide</span>
        </div>

        {/* Dashboard mockup */}
        <DashboardMockup />
      </div>
    </section>
  );
}

/* ───────────────────── Stats Bar ───────────────────── */
function StatsBar() {
  const stats = [
    { value: "2,500+", label: "Companies" },
    { value: "48,000+", label: "Connections made" },
    { value: "95%", label: "Match accuracy" },
    { value: "4.9★", label: "Average rating" },
  ];
  return (
    <section className="border-y border-gray-200 bg-gray-50/50 py-10">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center gap-1">
              <span className="text-3xl font-extrabold tracking-tight text-gray-900">{s.value}</span>
              <span className="text-sm font-semibold text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────── Features Bento Grid ──────────────── */
function FeaturesSection() {
  const features = [
    { icon: Zap, title: "AI-Powered Matching", desc: "Our intelligent algorithm surfaces the exact partners, suppliers, and investors that fit your business — no guesswork required.", wide: true, accent: "blue" },
    { icon: Globe, title: "Global Directory", desc: "Search and filter thousands of verified businesses across industries and geographies.", wide: false, accent: "indigo" },
    { icon: Shield, title: "Verified Profiles", desc: "Every company is vetted and verified so you only connect with legitimate businesses.", wide: false, accent: "green" },
    { icon: TrendingUp, title: "Analytics Dashboard", desc: "Track profile views, connection rates, and market reach with real-time insights.", wide: false, accent: "orange" },
    { icon: Users, title: "Community Groups", desc: "Join industry-specific groups, share knowledge, and build a trusted inner circle.", wide: false, accent: "violet" },
    { icon: BarChart3, title: "B2B Marketplace", desc: "List your services, source suppliers, and transact securely — all within the platform.", wide: true, accent: "blue" },
  ];

  const accentMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
  };

  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
            Platform Features
          </span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Everything you need to <span className="text-blue-600">grow.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
            A complete suite of tools purpose-built for B2B networking, discovery, and collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title}
              className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 ${f.wide ? "sm:col-span-2 lg:col-span-2" : ""}`}>
              <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${accentMap[f.accent].split(" ")[0]}`} style={{ filter: "blur(20px)" }} />
              <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${accentMap[f.accent]}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────── How It Works ────────────────── */
function HowItWorks() {
  const steps = [
    { num: "01", icon: UserPlus, title: "Create your profile", desc: "Build a compelling business identity — add your services, team size, location, and what you're looking for." },
    { num: "02", icon: Network, title: "Get matched instantly", desc: "Our AI analyses your profile and instantly surfaces the most relevant partners, investors, and clients for you." },
    { num: "03", icon: Handshake, title: "Connect & collaborate", desc: "Send connection requests, chat securely, and close deals — all within a trusted, verified environment." },
    { num: "04", icon: Rocket, title: "Scale your network", desc: "Track your growth, expand to new markets, and leverage community insights to keep accelerating." },
  ];

  return (
    <section id="how-it-works" className="bg-[#F3F2EF] py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
            How it works
          </span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Up and running in <span className="text-blue-600">minutes.</span>
          </h2>
        </div>

        <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connector line */}
          <div className="absolute top-12 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent lg:block" />

          {steps.map((s, i) => (
            <div key={s.num} className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/20">
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-4xl font-black text-gray-100">{s.num}</span>
              </div>
              <h3 className="mb-2 text-base font-bold text-gray-900">{s.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────── Testimonials ────────────── */
function Testimonials() {
  const testimonials = [
    { quote: "Connecto transformed how we source suppliers. We found three strategic partners in our first week.", name: "Lana Bernier", role: "CEO, TechNova", initials: "LB", color: "bg-blue-600" },
    { quote: "The AI matching is incredible — it surfaces exactly the kind of companies we want to collaborate with.", name: "James Holden", role: "Founder, BuildCraft", initials: "JH", color: "bg-emerald-600" },
    { quote: "Best B2B platform I've used. The marketplace alone is worth it. Closed two deals in month one.", name: "Sarah Chen", role: "VP Sales, GreenTech", initials: "SC", color: "bg-violet-600" },
  ];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="mb-12 text-center">
          <div className="mb-3 flex justify-center gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Loved by businesses worldwide.</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50/50 p-7 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300">
              <div className="mb-5 flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-gray-700 font-medium">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3 pt-5 border-t border-gray-200">
                <div className={`h-9 w-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-extrabold shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500 font-medium">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────── CTA ────────────── */
function CTASection() {
  const perks = ["Free to join", "No credit card required", "Connect in minutes"];
  return (
    <section className="relative overflow-hidden bg-blue-600 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(37,99,235,0),rgba(29,78,216,0.8))]" />
      <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8 text-center">
        <h2 className="mb-5 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Your next business partner <br className="hidden sm:block" />is already on Connecto.
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg text-blue-100 font-medium">
          Join thousands of companies already growing their network. Start today, completely free.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {perks.map((p) => (
            <div key={p} className="flex items-center gap-2 text-blue-100 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-blue-300" />
              {p}
            </div>
          ))}
        </div>
        <Link href="/signup"
          className={`inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-base font-bold text-blue-600 shadow-2xl shadow-blue-900/30 hover:bg-gray-50 hover:shadow-blue-900/40 hover:-translate-y-0.5 active:translate-y-0 ${ease}`}>
          Create your free account
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}

/* ────────────── Footer ────────────── */
function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-col items-center gap-5 md:flex-row md:justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm group-hover:shadow-md group-hover:shadow-blue-600/30 ${ease}`}>
              <span className="text-sm font-extrabold text-white">C</span>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-gray-900">Connecto</span>
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            <span className="text-gray-300">|</span>
            <span>© {new Date().getFullYear()} Connecto</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ────────────── Page ────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorks />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}