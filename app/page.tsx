"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, Play, Briefcase, Search, ShoppingBag, Users, BarChart3, 
  Globe, Building2, Handshake, Factory, UserPlus, Rocket, Network, 
  CheckCircle2, Star, ChevronDown, Mail, Zap, Shield, Laptop
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-100px" },
  transition: { staggerChildren: 0.1 }
};

/* ───────────────────────── Landing Navbar ───────────────────────── */
function LandingNav() {
  const links = [
    { label: "Home", href: "#", active: true },
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md"
    >
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
    </motion.header>
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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />

      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16">
        {/* Left */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 space-y-8 text-center lg:text-left"
        >
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
        </motion.div>

        {/* Right — Dashboard mockup */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1"
        >
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-100 via-transparent to-indigo-100 opacity-60 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-200/50">
              <Image
                src="/dashboard-mockup.jpg"
                alt="Connecto Platform Dashboard"
                width={720}
                height={480}
                className="w-full"
                priority
              />
            </div>
          </div>
        </motion.div>
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

  return (
    <section id="features" className="border-y border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-[1280px] px-6">
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5"
        >
          {features.map((f) => (
            <motion.div variants={fadeIn} key={f.title} className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <f.icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{f.title}</h3>
              <p className="text-xs leading-relaxed text-gray-500">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────── Trusted By Section ──────────────────── */
function TrustedBy() {
  const companies = ["TechNova", "BuildCraft", "PrintX", "Elevate", "GreenTech", "NextGen"];

  return (
    <section className="bg-gray-50 py-10">
      <div className="mx-auto max-w-[1280px] px-6">
        <motion.div {...fadeIn} className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
          <span className="whitespace-nowrap text-sm font-medium text-gray-400">
            Trusted by businesses worldwide
          </span>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {companies.map((name) => (
              <div key={name} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200/50">
                  <Building2 className="h-4 w-4 text-gray-500" />
                </div>
                <span className="text-sm font-bold tracking-wide text-gray-500">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────── How It Works Section ──────────────────── */
function HowItWorks() {
  const steps = [
    { num: 1, title: "Create your profile", desc: "Sign up and create your business profile in minutes.", color: "bg-blue-500", icon: UserPlus },
    { num: 2, title: "Connect with businesses", desc: "Find and connect with businesses that match your goals.", color: "bg-indigo-500", icon: Network },
    { num: 3, title: "Collaborate & Grow", desc: "Share ideas, explore opportunities and work together.", color: "bg-violet-500", icon: Handshake },
    { num: 4, title: "Expand your network", desc: "Build long-term relationships and take your business further.", color: "bg-purple-500", icon: Rocket },
  ];

  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <motion.div {...fadeIn} className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How Connecto works
          </h2>
          <p className="mt-3 text-base text-gray-500">
            Simple steps to expand your business network and grow
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <motion.div
              variants={fadeIn}
              key={s.num}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-7 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50"
            >
              <div className={`mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${s.color}`}>
                {s.num}
              </div>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 transition-colors group-hover:bg-blue-50">
                <s.icon className="h-7 w-7 text-gray-400 transition-colors group-hover:text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────── Statistics Section ──────────────────── */
function Statistics() {
  const stats = [
    { value: "10K+", label: "Active Businesses" },
    { value: "50K+", label: "Connections Made" },
    { value: "25+", label: "Industries" },
    { value: "100+", label: "Countries" },
  ];

  return (
    <section className="bg-blue-600 py-20 text-white">
      <div className="mx-auto max-w-[1280px] px-6">
        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid grid-cols-2 gap-10 md:grid-cols-4 text-center">
          {stats.map((s) => (
            <motion.div variants={fadeIn} key={s.label}>
              <div className="text-4xl font-extrabold lg:text-5xl">{s.value}</div>
              <div className="mt-2 text-sm font-medium text-blue-200">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────── Testimonials Section ──────────────────── */
function Testimonials() {
  const reviews = [
    { name: "John Doe", role: "CEO, TechNova", content: "Connecto helped us find critical partners that scaled our operations 10x in a year." },
    { name: "Sarah Smith", role: "Founder, GreenTech", content: "The best B2B networking platform out there. Highly recommend it to any startup." },
    { name: "Michael Lee", role: "Director, BuildCraft", content: "We closed our biggest deal through a connection we made on Connecto's marketplace." },
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <motion.div {...fadeIn} className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">What our users say</h2>
        </motion.div>
        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <motion.div variants={fadeIn} key={i} className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1 mb-4 text-yellow-400">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-gray-600 mb-6 italic">"{r.content}"</p>
              <div className="font-semibold text-gray-900">{r.name}</div>
              <div className="text-sm text-gray-500">{r.role}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────── Pricing Section ──────────────────── */
function Pricing() {
  const plans = [
    { name: "Basic", price: "Free", features: ["Basic profile", "Up to 50 connections", "Community access"] },
    { name: "Pro", price: "$29/mo", popular: true, features: ["Verified badge", "Unlimited connections", "Marketplace listings", "Advanced analytics"] },
    { name: "Enterprise", price: "Custom", features: ["Dedicated support", "API access", "Custom integrations", "White-glove onboarding"] },
  ];

  return (
    <section id="pricing" className="bg-white py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <motion.div {...fadeIn} className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Simple, transparent pricing</h2>
        </motion.div>
        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid gap-8 md:grid-cols-3 items-center">
          {plans.map((p, i) => (
            <motion.div variants={fadeIn} key={i} className={`relative rounded-3xl p-8 ${p.popular ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-gray-50 text-gray-900 border border-gray-100'}`}>
              {p.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-400 to-blue-300 text-blue-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Most Popular</span>}
              <h3 className="text-xl font-semibold mb-2">{p.name}</h3>
              <div className="text-4xl font-bold mb-6">{p.price}</div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <CheckCircle2 className={`w-5 h-5 ${p.popular ? 'text-blue-300' : 'text-blue-600'}`} />
                    <span className={p.popular ? 'text-blue-50' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-xl font-semibold transition-all ${p.popular ? 'bg-white text-blue-600 hover:bg-gray-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                Choose {p.name}
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────── FAQ Section ──────────────────── */
function FAQ() {
  const faqs = [
    { q: "Is Connecto free to use?", a: "Yes, we offer a free Basic plan to help you get started. You can upgrade to Pro for more features." },
    { q: "How do I verify my business?", a: "Business verification requires submitting valid company registration documents through your account settings." },
    { q: "Can I cancel my subscription anytime?", a: "Absolutely. There are no long-term contracts, and you can cancel anytime from your dashboard." },
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div {...fadeIn} className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Frequently Asked Questions</h2>
        </motion.div>
        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div variants={fadeIn} key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex justify-between items-center">
                {faq.q}
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </h3>
              <p className="text-gray-600">{faq.a}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────── Integrations Section ──────────────────── */
function Integrations() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[1280px] px-6 text-center">
        <motion.div {...fadeIn} className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Integrates with your stack</h2>
          <p className="mt-3 text-base text-gray-500">Connecto works seamlessly with tools you already use.</p>
        </motion.div>
        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="flex flex-wrap justify-center gap-6">
          {[Zap, Shield, Laptop, Mail, Globe, Database].map((Icon, i) => (
            <motion.div variants={fadeIn} key={i} className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Icon className="w-8 h-8 text-gray-400" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
// placeholder for Database icon if not imported
const Database = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>;

/* ──────────────────── Newsletter Section ──────────────────── */
function Newsletter() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div {...fadeIn} className="bg-blue-600 rounded-3xl p-10 md:p-16 shadow-2xl text-white">
          <h2 className="text-3xl font-bold mb-4">Stay in the loop</h2>
          <p className="mb-8 text-blue-100">Get the latest business insights and networking tips directly in your inbox.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" className="flex-1 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-400" required />
            <button type="submit" className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">Subscribe</button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────── Blog Preview Section ──────────────────── */
function BlogPreview() {
  const posts = [
    { title: "10 Tips for B2B Networking", date: "Sep 15, 2026", category: "Guides" },
    { title: "How to Optimize Your Business Profile", date: "Sep 10, 2026", category: "Tips" },
    { title: "The Future of Digital Collaboration", date: "Sep 05, 2026", category: "Insights" },
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <motion.div {...fadeIn} className="mb-14 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Latest from the blog</h2>
            <p className="mt-2 text-gray-500">Insights and news from our team.</p>
          </div>
          <Link href="#" className="hidden sm:inline-flex items-center text-blue-600 font-semibold hover:underline">
            View all <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </motion.div>
        <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid gap-8 md:grid-cols-3">
          {posts.map((post, i) => (
            <motion.div variants={fadeIn} key={i} className="group cursor-pointer">
              <div className="h-48 rounded-2xl bg-gray-100 mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/40 transition-colors" />
              </div>
              <div className="text-sm text-blue-600 font-semibold mb-2">{post.category}</div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{post.title}</h3>
              <div className="text-sm text-gray-500 mt-2">{post.date}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────── CTA Section ──────────────────── */
function CTASection() {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 py-20">
      <motion.div {...fadeIn} className="mx-auto max-w-[1280px] px-6 text-center">
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
      </motion.div>
    </section>
  );
}

/* ──────────────────── Footer ──────────────────── */
function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid gap-8 md:grid-cols-4 mb-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-base font-bold text-white">C</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Connecto</span>
            </Link>
            <p className="text-sm text-gray-500">The premier business networking platform for modern companies.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-blue-600">Features</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Pricing</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Marketplace</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-blue-600">About</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Blog</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-blue-600">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Connecto. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Social icons could go here */}
          </div>
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
      <TrustedBy />
      <FeaturesBar />
      <HowItWorks />
      <Statistics />
      <Integrations />
      <Testimonials />
      <Pricing />
      <FAQ />
      <BlogPreview />
      <Newsletter />
      <CTASection />
      <Footer />
    </div>
  );
}