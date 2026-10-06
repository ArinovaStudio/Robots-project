"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, ArrowLeftRight, Briefcase, Building2, Check, CheckCircle2,
  ChevronRight, Factory, Handshake, Laptop, MessageCircle, Search,
  ShoppingBag, Sparkles, Store, UserPlus, Users
} from "lucide-react";

/* ────────────── Shared animation class helpers ────────────── */
const ease = "transition-all duration-300";

/* ───────────────────────── Navbar ───────────────────────── */
function LandingNav() {
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
            {[
              ["Features", "#features"],
              ["How it works", "#how-it-works"],
              ["Pricing", "#pricing"],
            ].map(([label, href]) => (
              <a key={label} href={href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                {label}
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
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-200/60 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-blue-600/15 blur-2xl rounded-full" />

      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-300/40">
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

        <div className="flex bg-[#F3F2EF] min-h-[340px]">
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

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[["142", "Connections"], ["28", "Followers"], ["6", "Pending"]].map(([n, l]) => (
                <div key={l} className="bg-white border border-gray-100 rounded-xl p-2.5 text-center shadow-sm">
                  <div className="text-sm font-extrabold text-gray-900">{n}</div>
                  <div className="text-[9px] text-gray-400 font-semibold">{l}</div>
                </div>
              ))}
            </div>
          </div>

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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f7ff_1px,transparent_1px),linear-gradient(to_bottom,#f0f7ff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,#000_40%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/8 rounded-full blur-3xl" />

      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center px-5 sm:px-8 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
          </span>
          <span className="text-sm font-semibold text-blue-700">A network built around businesses</span>
        </div>

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

        <div className="mb-16 flex items-center gap-6 text-sm text-gray-500">
          <div className="flex -space-x-2">
            {["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500"].map((c, i) => (
              <div key={i} className={`h-8 w-8 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                {["T", "B", "P", "E"][i]}
              </div>
            ))}
          </div>
          <span>Built for <strong className="text-gray-800 font-bold">businesses that grow together</strong></span>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}

/* ───────────────────── Stats Bar ───────────────────── */
function StatsBar() {
  const industries = [
    "Consulting", "Manufacturing", "Technology", "Retail", "Creative studios",
    "Professional services", "Startups", "Wholesale",
  ];
  const benefits = [
    ["Business-first", "Made for companies and professionals"],
    ["Discover", "Find services, partners and opportunities"],
    ["Connect", "Build trusted business relationships"],
    ["Grow", "Share what you offer with the right network"],
  ];
  return (
    <section className="overflow-hidden border-y border-gray-200 bg-[#f7f8fc] py-12">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
          One network for every kind of business
        </p>
        <div className="relative mb-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="landing-marquee flex w-max animate-[marquee_32s_linear_infinite] gap-3 motion-reduce:animate-none">
            {[...industries, ...industries].map((industry, index) => (
              <span key={`${industry}-${index}`} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 shadow-sm">
                {industry}
              </span>
            ))}
          </div>
        </div>
        <p className="mb-5 text-center text-sm text-gray-500">
          Find the people, services and opportunities your business needs.
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {benefits.map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <span className="block text-lg font-extrabold text-gray-900">{title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-gray-500">{description}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────── Problem to solution ──────────────── */
function ProblemSolution() {
  const problems = [
    "Cold emails go unanswered",
    "Hard to find trusted partners",
    "Services are scattered everywhere",
    "Business gets lost in the feed",
    "Too much time spent searching",
  ];

  return (
    <section className="overflow-hidden bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">A better way to do business</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            LinkedIn was built for people.
            <br className="hidden sm:block" /> Your business needs more.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
            Finding clients and partners shouldn’t feel like shouting into the void.
          </p>
        </div>

        <div className="grid items-center gap-8 md:grid-cols-[1fr_56px_1fr]">
          <div className="relative grid gap-3 sm:grid-cols-2 md:block md:h-[340px]">
            {problems.map((problem, index) => (
              <div
                key={problem}
                className={`rounded-2xl border border-gray-200 bg-[#f8f8fa] p-4 shadow-sm transition-transform duration-700 hover:rotate-0 md:absolute md:w-[72%] ${
                  index % 2 === 0 ? "md:left-0" : "md:right-0"
                } ${
                  ["md:top-0 -rotate-2", "md:top-16 rotate-2", "md:top-32 -rotate-1", "md:top-48 rotate-2", "md:top-64 -rotate-2"][index]
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">The old way</span>
                </div>
                <p className="font-bold text-gray-800">{problem}</p>
                <div className="mt-3 h-1.5 w-2/3 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>

          <div className="flex justify-center text-3xl font-light text-blue-600 md:rotate-0">
            <ArrowRight className="h-8 w-8 rotate-90 md:rotate-0" aria-hidden="true" />
          </div>

          <div className="relative flex min-h-[300px] items-center justify-center rounded-[2rem] bg-blue-50/70 p-6">
            <svg viewBox="0 0 320 320" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <g stroke="#93c5fd" strokeDasharray="5 6" strokeWidth="2">
                <path d="M160 160 160 35M160 160 270 95M160 160 270 245M160 160 160 285M160 160 50 245M160 160 50 95" />
              </g>
            </svg>
            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-600 text-lg font-extrabold text-white shadow-xl shadow-blue-600/25">
              Connecto
            </div>
            {[
              ["Find clients", "left-1/2 top-[8%] -translate-x-1/2"],
              ["Trade services", "right-[2%] top-[28%]"],
              ["Grow your network", "right-[1%] bottom-[18%]"],
              ["Trusted partners", "left-1/2 bottom-[5%] -translate-x-1/2"],
              ["Promote your brand", "left-[1%] bottom-[18%]"],
              ["Discover businesses", "left-[1%] top-[28%]"],
            ].map(([label, position]) => (
              <span key={label} className={`absolute z-10 rounded-full border border-blue-100 bg-white px-3 py-2 text-center text-[11px] font-bold text-gray-700 shadow-sm sm:text-xs ${position}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────── How It Works ────────────────── */
function HowItWorks() {
  const steps = [
    { num: "1", icon: UserPlus, title: "Create your business profile", desc: "Add your services, industry and portfolio in minutes.", detail: ["Your business", "What you offer", "What you need"] },
    { num: "2", icon: Search, title: "Connect and discover", desc: "Find businesses by service, location or industry and discover the right connections.", detail: ["Browse businesses", "Find by location", "Send a request"] },
    { num: "3", icon: Handshake, title: "Exchange and grow", desc: "Win clients, swap services and promote your brand to the right audience.", detail: ["Start a conversation", "Share your services", "Build partnerships"] },
  ];

  return (
    <section id="how-it-works" className="bg-[#f7f8fc] py-20 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">How it works</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            From profile to partnership in three steps.
          </h2>
        </div>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.num} className={`flex items-start gap-4 sm:gap-6 ${index === 1 ? "lg:ml-[12%]" : index === 2 ? "lg:ml-[24%]" : ""}`}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-extrabold text-white shadow-lg shadow-blue-600/20 sm:h-14 sm:w-14 sm:text-xl">
                {step.num}
              </div>
              <div className="grid flex-1 gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <step.icon className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Step {step.num}</p>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-500">{step.desc}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:max-w-[230px] sm:justify-end">
                  {step.detail.map((item) => (
                    <span key={item} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">{item}</span>
                  ))}
                </div>
              </div>
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
    { icon: Building2, title: "Business profiles", desc: "A dedicated page to showcase your services, work and credibility.", style: "md:col-span-2 md:row-span-2", visual: "profile" },
    { icon: Search, title: "Smart discovery", desc: "Find businesses by industry, service or location.", style: "md:col-span-2", visual: "discovery" },
    { icon: ArrowLeftRight, title: "Service exchange", desc: "Trade services with other businesses.", style: "", visual: "exchange" },
    { icon: MessageCircle, title: "Direct messaging", desc: "Talk with businesses and decision-makers.", style: "md:row-span-2", visual: "messages" },
    { icon: Users, title: "Business feed", desc: "Share updates, offers and wins with your network.", style: "", visual: "feed" },
    { icon: Store, title: "Service marketplace", desc: "List what you offer and find what your business needs.", style: "md:col-span-2", visual: "marketplace" },
  ];

  return (
    <section id="features" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">The Connecto toolkit</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Everything your business needs to grow.</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">A focused set of tools to help you get discovered, connect with businesses and create new opportunities.</p>
        </div>

        <div className="grid auto-rows-[minmax(180px,auto)] gap-3 sm:grid-cols-2 md:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className={`group flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-[#f8f9fc] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl sm:p-6 ${feature.style}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900">{feature.title}</h3>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">{feature.desc}</p>
                </div>
                <span className="hidden text-3xl font-black text-blue-100 transition-colors group-hover:text-blue-200 sm:block">↗</span>
              </div>
              <div className={`mt-auto min-h-16 rounded-2xl bg-white p-3 ${feature.visual === "profile" ? "mt-6 min-h-36 border border-gray-100" : "mt-5 border border-gray-100"}`}>
                {feature.visual === "profile" && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">A</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800">Your business profile</p>
                      <p className="mt-1 text-xs text-gray-400">Services · Work · About</p>
                      <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">Design</span><span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">Marketing</span><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Verified</span></div>
                    </div>
                  </div>
                )}
                {feature.visual === "discovery" && <div className="flex h-full flex-wrap items-center gap-2"><span className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-400">Search businesses and services</span><span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700">Design</span><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-700">Mumbai</span><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">Consulting</span></div>}
                {feature.visual === "exchange" && <div className="flex items-center justify-center gap-3 py-2"><span className="rounded-xl bg-blue-50 p-2 text-blue-600"><Briefcase className="h-4 w-4" /></span><ArrowLeftRight className="h-4 w-4 text-gray-400" /><span className="rounded-xl bg-violet-50 p-2 text-violet-600"><ShoppingBag className="h-4 w-4" /></span></div>}
                {feature.visual === "messages" && <div className="space-y-2"><div className="h-6 w-3/4 rounded-xl rounded-bl-sm bg-gray-100" /><div className="ml-auto h-6 w-2/3 rounded-xl rounded-br-sm bg-blue-100" /><div className="h-6 w-1/2 rounded-xl rounded-bl-sm bg-gray-100" /></div>}
                {feature.visual === "feed" && <div className="flex items-center gap-2"><span className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-300 to-rose-400" /><span className="h-2 w-2/3 rounded-full bg-gray-100" /><span className="ml-auto text-blue-500">♡</span></div>}
                {feature.visual === "marketplace" && <div className="grid grid-cols-3 gap-2"><div className="h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50" /><div className="h-12 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50" /><div className="h-12 rounded-lg bg-gradient-to-br from-violet-100 to-purple-50" /></div>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────── Who it's for ──────────────── */
function WhoItsFor() {
  const industries = [
    { name: "Agencies", icon: Sparkles, headline: "Find clients who need your expertise.", description: "Showcase what your agency does and connect with businesses looking for creative, marketing and technology services.", tags: ["Creative", "Marketing", "Technology"] },
    { name: "Consultants & CA firms", icon: Briefcase, headline: "Be discovered by businesses seeking trusted advisors.", description: "Present your expertise, share your services and build relationships with businesses that need your guidance.", tags: ["Finance", "Strategy", "Legal"] },
    { name: "Manufacturers", icon: Factory, headline: "Meet suppliers, distributors and buyers.", description: "Make your products and capabilities easier to find across the business network.", tags: ["Production", "Wholesale", "Supply"] },
    { name: "Retailers & wholesalers", icon: Store, headline: "Find vendors and grow your reach.", description: "Explore business services and create new supplier relationships for your next stage of growth.", tags: ["Retail", "Wholesale", "Sourcing"] },
    { name: "Startups", icon: Laptop, headline: "Build the relationships behind your next milestone.", description: "Discover clients, collaborators and services that can help your business move forward.", tags: ["Early stage", "Product", "Growth"] },
    { name: "Studios & freelancers", icon: Building2, headline: "Showcase your work and win bigger projects.", description: "Build a business presence and connect directly with teams looking for your craft.", tags: ["Design", "Media", "Consulting"] },
  ];
  const [activeIndustry, setActiveIndustry] = useState(0);
  const selected = industries[activeIndustry];

  return (
    <section className="bg-[#f7f8fc] py-20 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">One network, many industries</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Built for every kind of business.</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {industries.map((industry, index) => (
              <button
                key={industry.name}
                type="button"
                onClick={() => setActiveIndustry(index)}
                aria-pressed={activeIndustry === index}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  activeIndustry === index ? "bg-blue-600 text-white shadow-md shadow-blue-600/15" : "border border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700"
                }`}
              >
                <industry.icon className="h-4 w-4 shrink-0" />
                {industry.name}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <div className="ml-2 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-400">connecto.app/directory</div>
            </div>
            <div className="grid gap-6 p-5 sm:grid-cols-[1fr_200px] sm:p-7">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><selected.icon className="h-5 w-5" /></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Connecto for</p><h3 className="font-extrabold text-gray-900">{selected.name}</h3></div>
                </div>
                <h4 className="max-w-lg text-2xl font-extrabold leading-tight text-gray-900">{selected.headline}</h4>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500">{selected.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">{selected.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{tag}</span>)}</div>
                <Link href="/directory" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">
                  Explore the directory <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="hidden rounded-2xl bg-[#f7f8fc] p-4 sm:block">
                <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">A business profile</p>
                <div className="mb-3 flex h-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100"><selected.icon className="h-7 w-7 text-blue-600" /></div>
                <div className="h-2 w-2/3 rounded-full bg-gray-200" />
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100" />
                <div className="mt-2 h-2 w-4/5 rounded-full bg-gray-100" />
                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Show what your business does</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────── What’s next ──────────────── */
function RoadmapSection() {
  const phases = [
    { status: "Available now", title: "Business network", description: "Create a business profile, discover services, connect and message businesses.", active: true },
    { status: "Building on the network", title: "Growth tools", description: "More ways to promote your business and understand your reach.", active: false },
    { status: "Coming later", title: "Investor connections", description: "A future way to help businesses meet investors through the network.", active: false },
  ];
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Growing with you</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Today, clients. Tomorrow, more.</h2>
        <div className="relative mt-12 grid gap-4 md:grid-cols-3">
          <div className="absolute left-[8%] right-[8%] top-3 hidden border-t-2 border-dashed border-blue-200 md:block" />
          {phases.map((phase) => (
            <article key={phase.title} className={`relative rounded-2xl border p-6 ${phase.active ? "border-blue-200 bg-blue-50/60" : "border-gray-200 bg-gray-50"}`}>
              <span className={`mb-5 block h-6 w-6 rounded-full border-4 border-white shadow-sm ${phase.active ? "bg-blue-600" : "bg-gray-300"}`} />
              <p className={`text-xs font-bold uppercase tracking-wider ${phase.active ? "text-blue-700" : "text-gray-400"}`}>{phase.status}</p>
              <h3 className="mt-2 text-lg font-extrabold text-gray-900">{phase.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{phase.description}</p>
              {!phase.active && <p className="mt-4 text-xs font-semibold text-gray-400">Planned for a future phase</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────── Early access ──────────────── */
function PricingSection() {
  const included = ["Business profile", "Business discovery", "Connections and messaging", "Service exchange"];
  return (
    <section id="pricing" className="bg-[#f7f8fc] py-20 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Early access</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Free while we grow with you.</h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">Start building your business network. No credit card needed.</p>
        </div>
        <div className="mx-auto grid max-w-4xl items-center gap-4 md:grid-cols-[1fr_1.2fr_1fr]">
          <div className="hidden rounded-2xl border border-gray-200 bg-white p-6 opacity-70 md:block">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Later</p>
            <h3 className="mt-2 text-lg font-extrabold text-gray-700">Growth</h3>
            <p className="mt-1 text-sm text-gray-400">More ways to promote</p>
            <div className="mt-5 h-px bg-gray-100" />
            <p className="mt-4 text-xs font-medium text-gray-400">Planned for a future release</p>
          </div>
          <div className="rounded-3xl border-2 border-blue-600 bg-white p-7 shadow-xl shadow-blue-900/5 sm:p-8">
            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">Early access</span>
            <h3 className="mt-4 text-2xl font-extrabold text-gray-900">Connecto</h3>
            <p className="mt-1 text-4xl font-black tracking-tight text-gray-900">Free</p>
            <p className="mt-1 text-sm text-gray-500">Get started with your business network.</p>
            <ul className="my-6 space-y-3">
              {included.map((item) => <li key={item} className="flex items-center gap-2 text-sm font-medium text-gray-700"><Check className="h-4 w-4 text-blue-600" />{item}</li>)}
            </ul>
            <Link href="/signup" className={`flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 ${ease}`}>
              Join Connecto free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden rounded-2xl border border-gray-200 bg-white p-6 opacity-70 md:block">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Later</p>
            <h3 className="mt-2 text-lg font-extrabold text-gray-700">Pro</h3>
            <p className="mt-1 text-sm text-gray-400">More tools for teams</p>
            <div className="mt-5 h-px bg-gray-100" />
            <p className="mt-4 text-xs font-medium text-gray-400">Planned for a future release</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────── Frequently asked questions ──────────────── */
function FAQSection() {
  const questions = [
    ["What is Connecto?", "Connecto is a professional network built for businesses to find clients, discover services and grow together."],
    ["How is it different from LinkedIn?", "Connecto puts businesses at the centre, with business profiles, service discovery and service exchange as core parts of the experience."],
    ["Who can join?", "Businesses of different sizes and industries can create a profile and take part in the network."],
    ["Is it free?", "Connecto is free to join during early access. Any future paid plans will be communicated before they launch."],
    ["How does service exchange work?", "Businesses can list what they offer and connect with others to discuss a service trade or another kind of collaboration."],
    ["When will investor connections launch?", "Investor connections are planned for a future phase. The current network is focused on business discovery and connections."],
  ];
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-[1080px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Need to know</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Questions? We’ve got you.</h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-gray-500">A few answers to help you get started with Connecto.</p>
          <Link href="/signup" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">Get started <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="space-y-3">
          {questions.map(([question, answer], index) => (
            <details key={question} open={index === 0} className="group rounded-2xl border border-gray-200 bg-[#f8f9fc] p-5 open:bg-white open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-gray-900">
                {question}
                <ChevronRight className="h-4 w-4 shrink-0 text-blue-600 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 pr-6 text-sm leading-relaxed text-gray-500">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────── Final CTA ────────────── */
function CTASection() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="relative mx-auto max-w-[1080px] overflow-hidden rounded-[2rem] bg-blue-50 px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="absolute -left-8 top-8 h-20 w-20 rounded-full bg-blue-200/50" />
        <div className="absolute bottom-8 left-[14%] h-10 w-10 rounded-full bg-indigo-200/60" />
        <div className="absolute -right-6 top-10 h-16 w-16 rounded-full bg-violet-200/60" />
        <div className="absolute bottom-[-20px] right-[12%] h-24 w-24 rounded-full bg-blue-200/50" />
        <div className="relative mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Make your next connection count</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Your next client could be on Connecto.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
            Create your business profile and start building relationships that move your business forward.
          </p>
          <Link href="/signup"
            className={`mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 ${ease}`}>
            Join Connecto free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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

export default function LandingClient() {
  return (
    <main className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <ProblemSolution />
      <HowItWorks />
      <FeaturesSection />
      <WhoItsFor />
      <RoadmapSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
