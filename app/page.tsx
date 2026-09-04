import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, Play, Briefcase, Search, ShoppingBag, Users, BarChart3, 
  Globe, Building2, Handshake, Factory, UserPlus, Rocket, Network 
} from "lucide-react";

/* ───────────────────────── Landing Navbar ───────────────────────── */
function LandingNav() {
  const links = [
    { label: "Home", href: "#", active: true },
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Connecto</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  l.active
                    ? "text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="group relative">
              <button className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
                Resources
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </nav>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-200"
          >
            Create account
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────── Hero Section ───────────────────────── */
function HeroSection() {
  const avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Anita",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-gray-50/50 pt-12 pb-8 lg:pt-20 lg:pb-12">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />

      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16">
        {/* Left */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5">
            <Rocket className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              The #1 Business Networking Platform
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem]">
            Connect. Collaborate.{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Grow Together.
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-lg text-lg leading-relaxed text-gray-500 lg:text-xl">
            Connecto helps business owners, startups, and enterprises build
            meaningful connections, discover opportunities, and grow their
            business network.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200"
            >
              Get started for free
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <button className="inline-flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                <Play className="h-3.5 w-3.5 fill-gray-600 text-gray-600" />
              </div>
              Watch demo
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 pt-2 lg:justify-start">
            <div className="flex -space-x-2.5">
              {avatars.map((src, i) => (
                <div
                  key={i}
                  className="h-9 w-9 overflow-hidden rounded-full border-2 border-white"
                >
                  <Image src={src} alt="" width={36} height={36} />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Join <span className="font-semibold text-gray-900">10,000+</span>{" "}
              business owners already growing with Connecto
            </p>
          </div>
        </div>

        {/* Right — Dashboard mockup */}
        <div className="flex-1">
          <div className="relative">
            {/* Glow */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-100 via-transparent to-indigo-100 opacity-60 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-200/50">
              <Image
                src="/dashboard-mockup.jpg"
                alt="Connecto Platform Dashboard"
                width={720}
                height={480}
                quality={90}
                className="w-full"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Features + Stats Bar ─────────────────── */
function FeaturesBar() {
  const features = [
    { icon: Briefcase, title: "Business Networking", desc: "Connect with verified business owners" },
    { icon: Search, title: "Discover Opportunities", desc: "Find leads, partners & growth opportunities" },
    { icon: ShoppingBag, title: "B2B Marketplace", desc: "Buy, sell & collaborate with businesses" },
    { icon: Users, title: "Industry Communities", desc: "Join groups & grow your network" },
    { icon: BarChart3, title: "Business Insights", desc: "Stay updated with market trends" },
  ];

  const stats = [
    { icon: Building2, value: "10K+", label: "Active Businesses" },
    { icon: Handshake, value: "50K+", label: "Connections Made" },
    { icon: Factory, value: "25+", label: "Industries" },
    { icon: Globe, value: "100+", label: "Countries" },
  ];

  return (
    <section id="features" className="border-y border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* Features */}
          <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <f.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{f.title}</h3>
                <p className="text-xs leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden w-px self-stretch bg-gray-200 lg:block" />

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <s.icon className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xl font-bold text-gray-900">{s.value}</span>
                <span className="text-[11px] font-medium text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── How It Works Section ──────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: "Create your profile",
      desc: "Sign up and create your business profile in minutes.",
      color: "bg-blue-500",
      icon: UserPlus,
    },
    {
      num: 2,
      title: "Connect with businesses",
      desc: "Find and connect with businesses that match your goals.",
      color: "bg-indigo-500",
      icon: Network,
    },
    {
      num: 3,
      title: "Collaborate & Grow",
      desc: "Share ideas, explore opportunities and work together.",
      color: "bg-violet-500",
      icon: Handshake,
    },
    {
      num: 4,
      title: "Expand your network",
      desc: "Build long-term relationships and take your business further.",
      color: "bg-purple-500",
      icon: Rocket,
    },
  ];

  return (
    <section id="how-it-works" className="bg-gray-50/70 py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Header */}
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How Connecto works
          </h2>
          <p className="mt-3 text-base text-gray-500">
            Simple steps to expand your business network and grow
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-7 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50"
            >
              {/* Step number */}
              <div className={`mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${s.color}`}>
                {s.num}
              </div>

              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 transition-colors group-hover:bg-blue-50">
                <s.icon className="h-7 w-7 text-gray-400 transition-colors group-hover:text-blue-600" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Trusted By Section ───────────────────── */
function TrustedBy() {
  const companies = [
    "TechNova",
    "BuildCraft",
    "PrintX",
    "Elevate",
    "GreenTech",
    "NextGen",
  ];

  return (
    <section className="border-t border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
          <span className="whitespace-nowrap text-sm font-medium text-gray-400">
            Trusted by businesses worldwide
          </span>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {companies.map((name) => (
              <div key={name} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-sm font-bold tracking-wide text-gray-400">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── CTA Section ──────────────────── */
function CTASection() {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 py-20">
      <div className="mx-auto max-w-[1280px] px-6 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to grow your business network?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
          Join thousands of businesses already using Connecto to find partners,
          discover opportunities, and scale faster.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-50"
          >
            Get started for free
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── Footer ──────────────────── */
function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-10">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-base font-bold text-white">C</span>
          </div>
          <span className="text-lg font-bold text-gray-900">Connecto</span>
        </div>
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Connecto. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacy</Link>
          <Link href="#" className="text-sm text-gray-500 hover:text-gray-700">Terms</Link>
          <Link href="#" className="text-sm text-gray-500 hover:text-gray-700">Support</Link>
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────── Page ──────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <HeroSection />
      <FeaturesBar />
      <HowItWorks />
      <TrustedBy />
      <CTASection />
      <Footer />
    </div>
  );
}