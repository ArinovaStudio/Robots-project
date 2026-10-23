"use client";

import { useState } from "react";
import Link from "next/link";
import "./landing.css";
import {
  FeatureBento,
  FullPageJourney,
  Opportunities,
  CommunityBento,
  AnimatedTestimonials,
  WorkInPublic,
  ConnectionLoop,
} from "./enhanced-sections";
import { InvestorSection } from "./investor-preview";
import { HeroDashboard } from "./hero-dashboard";
import { CollaborationBrief } from "./collaboration-brief";
import { PlatformOverview } from "./platform-overview";
import { useLandingMotion } from "./use-landing-motion";
import { useLiquidGlass } from "./use-liquid-glass";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Layers,
  Menu,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Button } from "./landing-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Brand,
  businesses,
  BizLogo,
  ProductShowcase,
  type DemoView,
} from "./product-showcase";

const heroBlue = "/landing/hero-blue.jpg";
const links = "/landing/connect-links.png";
const appIcon = "/landing/app-icon.png";
const founder = "/landing/founder.jpg";

const faqs = [
  [
    "What is Connecto?",
    "Connecto is a social network for businesses. It brings your company profile, work, updates, connections, and service opportunities together in one place.",
  ],
  [
    "Is this for businesses or individuals?",
    "Company profiles are for businesses, from independent studios to growing startups. Investors are also part of the network: they discover company pitches and connect with teams to discuss backing their projects.",
  ],
  [
    "How does exchanging services work?",
    "Share what your business offers and what you need. Discover complementary businesses, start a conversation, and agree on a collaboration or a service exchange that works for both sides.",
  ],
  [
    "What can my business share?",
    "Your launches, achievements, case studies, behind-the-scenes work, lessons, and open collaboration opportunities. Anything that helps other businesses understand what you’re building.",
  ],
  [
    "How do investors use Connecto?",
    "Companies publish ideas and pitches with their vision, progress, and needs. Investors discover those pitches and connect with the company to discuss a potential investment. Both parties agree on their own terms; Connecto does not guarantee funding or process investment payments.",
  ],
  [
    "Can I join from anywhere?",
    "The vision is a global business community. Discover teams nearby or connect across borders, industries, and time zones.",
  ],
  [
    "When can I join the platform?",
    "Connecto is currently live! You can explore the sample product experience on this page, or sign up to join the real business network.",
  ],
];

function SectionHeading({
  label,
  title,
  copy,
  id,
}: {
  label: string;
  title: React.ReactNode;
  copy?: string;
  id?: string;
}) {
  return (
    <div className="section-heading" id={id}>
      <span className="eyebrow">{label}</span>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </div>
  );
}

export default function NexusLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<DemoView>("feed");
  const [dialog, setDialog] = useState<"join" | "directory" | null>(null);
  const [connections, setConnections] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [email, setEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  useLandingMotion();
  useLiquidGlass();

  const explore = () => setDialog("directory");
  const join = () => setDialog("join");

  return (
    <div className="landing-root min-h-screen">
      <header className="container-wide liquid-site-header" data-liquid-ignore>
        <div className="liquid-nav-surface" aria-hidden="true" />
        <nav className="nav" aria-label="Main navigation">
          <Brand />
          <div className="nav-links">
            <a href="#why">Why Connecto</a>
            <a href="#features">Features</a>
            <a href="#investors">Investors</a>
            <a href="#how-it-works">How it works</a>
            <a href="#stories">Community</a>
          </div>
          <div className="flex items-center gap-2">
            <Button className="nav-cta rounded-full h-10 px-5 text-xs" onClick={join}>
              Join the community <ArrowUpRight />
            </Button>
            <Button
              className="mobile-menu"
              variant="ghost"
              size="icon"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </nav>
        {menuOpen && (
          <div className="mobile-links">
            {[
              ["Why Connecto", "#why"],
              ["Features", "#features"],
              ["Investors", "#investors"],
              ["How it works", "#how-it-works"],
              ["Community", "#stories"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <Button onClick={join}>
              Join the community <ArrowUpRight />
            </Button>
          </div>
        )}
      </header>

      <main>
        <section className="hero">
          <img className="hero-background" src={heroBlue} alt="" width={954} height={768} />
          <div className="container-wide">
            <span className="eyebrow">
              <span className="text-primary">✦</span> Big things start with a connection
            </span>
            <h1>
              Your business.
              <br />A world of <span className="serif">possibilities.</span>
            </h1>
            <p className="hero-copy">
              The network built for businesses, not résumés.
              <br />
              Share your work. Pitch your ideas. Meet partners and investors.
            </p>
            <div className="hero-actions">
              <Button className="rounded-full h-11 px-6 text-xs" onClick={join}>
                Find your next connection <ArrowUpRight />
              </Button>
              <Button asChild variant="outline" className="rounded-full h-11 px-6 text-xs">
                <a href="#product">
                  See Connecto in action <ArrowDown />
                </a>
              </Button>
            </div>
            <p className="hero-note">For the ambitious teams building what’s next.</p>
          </div>
          <div className="hero-visual">
            <img
              className="hero-float"
              src={links}
              alt="Interlinked blue glass links"
              width={180}
              height={180}
            />
            <img
              className="hero-float right"
              src={appIcon}
              alt="Connecto sculptural app icon"
              width={168}
              height={168}
            />
            <HeroDashboard />
            <div className="floating-note">
              <Sparkles />
              <div>
                <b>Your next big thing is out there.</b> Let's help you find it.
              </div>
            </div>
          </div>
        </section>

        <section className="trust container-wide" aria-label="Business community">
          <p>A place for bold brands, bright ideas, and businesses like yours.</p>
          <div className="logo-carousel" aria-label="Illustrative business brands">
            <div className="logo-track">
              {[0, 1].map((copy) => (
                <div className="logo-row" key={copy} aria-hidden={copy === 1}>
                  {["Layers", "Sisyphus", "Circooles", "Quotient", "Catalog"].map((name, i) => (
                    <span key={name}>
                      <span className="logo-symbol">{["◫", "✳", "◈", "⌘", "✴"][i]}</span>
                      {name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="network-numbers">
            <div>
              <strong>03</strong>
              <span>Ways to grow</span>
              <small>Share. Pitch. Connect.</small>
            </div>
            <div>
              <strong>02</strong>
              <span>Sides of the same ambition</span>
              <small>Businesses + investors</small>
            </div>
            <div>
              <strong>01</strong>
              <span>More meaningful network</span>
              <small>Built around your business</small>
            </div>
          </div>
        </section>

        <section className="intro container-wide" id="why">
          <div className="intro-label">Less cold outreach. More real connection.</div>
          <h2>
            You’re building something great.
            <br />
            <span>It’s time the right businesses noticed.</span>
            <br />
            Meet a network that <span className="serif text-primary">works both ways.</span>
          </h2>
        </section>

        <section className="section container-wide" id="product">
          <SectionHeading
            label="Your new business home"
            title={
              <>
                Built to be seen.
                <br />
                <span className="serif">Designed to connect.</span>
              </>
            }
            copy="Not another directory. A living, breathing community where your work opens doors and every connection can become something more."
          />
          <div className="showcase-stage">
            <div className="showcase-tabs" role="tablist" aria-label="Product preview">
              {(
                [
                  { id: "feed", label: "Business feed", icon: Layers },
                  { id: "discover", label: "Discover businesses", icon: Compass },
                  { id: "messages", label: "Conversations", icon: MessageCircle },
                ] as const
              ).map((tab) => (
                <Button
                  role="tab"
                  aria-selected={view === tab.id}
                  key={tab.id}
                  variant="outline"
                  className={view === tab.id ? "selected" : ""}
                  onClick={() => setView(tab.id)}
                >
                  <tab.icon />
                  {tab.label}
                </Button>
              ))}
            </div>
            <ProductShowcase key={view} view={view} />
          </div>
          <div className="showcase-caption">
            <h3>
              {view === "feed"
                ? "Your work deserves more than a folder."
                : view === "discover"
                  ? "The right partner is closer than you think."
                  : "From a hello to a whole new possibility."}
            </h3>
            <p>
              {view === "feed"
                ? "Share the wins, the work, and the journey. Give other businesses a reason to remember you."
                : view === "discover"
                  ? "Explore complementary teams, discover their work, and make a meaningful connection."
                  : "Keep the conversation going. Build relationships that go beyond a connection request."}
            </p>
          </div>
        </section>

        <FeatureBento />
        <PlatformOverview explore={explore} />
        <FullPageJourney />
        <InvestorSection explore={explore} />
        <Opportunities explore={explore} />
        <CommunityBento explore={explore} />
        <CollaborationBrief explore={explore} />
        <AnimatedTestimonials />
        <WorkInPublic explore={explore} />
        <ConnectionLoop explore={explore} />

        <section className="manifesto container-wide">
          <img
            src={links}
            alt="Two businesses, connected"
            width={130}
            height={130}
            loading="lazy"
          />
          <h2>
            Business is better
            <br />
            <span className="serif">when it’s not a solo journey.</span>
          </h2>
          <p>
            Behind every great business is a network that believes in it. We’re building a place
            where ambitious teams find theirs.
          </p>
        </section>

        <section className="section container-wide" id="faq">
          <div className="faq-layout">
            <div className="faq-heading">
              <span className="eyebrow">A few things you might be wondering</span>
              <h2>
                Good questions.
                <br />
                <span className="serif">Straight answers.</span>
              </h2>
              <p>
                Curious about where you fit in?
                <br />
                You’re in good company.
              </p>
              <Button variant="link" className="p-0 mt-3 text-xs" onClick={explore}>
                Take a look around <ArrowUpRight />
              </Button>
            </div>
            <div>
              {faqs.map(([question, answer], i) => (
                <div className="faq-item" data-open={openFaq === i} key={question}>
                  <Button
                    variant="ghost"
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {question}
                    <Plus aria-hidden="true" />
                  </Button>
                  <div
                    className="faq-answer"
                    id={`faq-answer-${i}`}
                    aria-hidden={openFaq !== i}
                  >
                    <div>
                      <p>{answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta glass-banner">
          <img className="banner-background" src={heroBlue} alt="" width={954} height={768} />
          <img src={links} alt="" width={230} height={230} loading="lazy" />
          <div className="container-wide">
            <span className="eyebrow mb-6">Your next chapter is a connection away</span>
            <div className="banner-glass-label">
              <Users />
              <span>
                Independent businesses.
                <br />
                <b>Connected by ambition.</b>
              </span>
            </div>
            <h2>
              Don’t just build a business.
              <br />
              <span className="serif text-primary">Build your circle.</span>
            </h2>
            <p>Your next collaborator, investor, or big idea is out there. Let’s meet.</p>
            <Button className="rounded-full h-11 px-6 text-xs" onClick={join}>
              Find your people <ArrowUpRight />
            </Button>
          </div>
          <img src={appIcon} alt="" width={230} height={230} loading="lazy" />
        </section>
      </main>

      <footer className="footer container-wide">
        <div className="footer-grid">
          <div className="footer-brand">
            <Brand light />
            <p>
              Big ambitions.
              <br />
              <span>Better connections.</span>
            </p>
            <small>Good things happen together.</small>
          </div>
          <div className="footer-links-panel">
            <img src={appIcon} alt="Connecto app icon" width={175} height={175} loading="lazy" />
            <div className="footer-link-columns">
              <div>
                <h4>Explore</h4>
                <a href="#features">Features</a>
                <a href="#how-it-works">How it works</a>
                <a href="#opportunities">Opportunities</a>
                <a href="#investors">For investors</a>
                <a href="#stories">Community stories</a>
                <a href="#faq">FAQ</a>
              </div>
              <div>
                <h4>Connecto</h4>
                <a href="#why">Our purpose</a>
                <a href="#product">The platform</a>
                <a href="#community">Our community</a>
                <Link href="/directory">
                  Explore businesses
                </Link>
              </div>
            </div>
            <div className="footer-bottom">
              <small>© 2026 Connecto. Built for together.</small>
              <div className="newsletter">
                <h4>
                  <span>Good things are coming.</span>
                  <br />
                  Stay in the loop.
                </h4>
                <form
                  className="newsletter-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setNewsletterMessage(
                      "Thank you! Your email has been saved."
                    );
                  }}
                >
                  <input
                    type="email"
                    aria-label="Email address"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="rounded-lg">
                    Subscribe <ArrowUpRight className="size-3" />
                  </Button>
                </form>
                {newsletterMessage && (
                  <p role="status" className="newsletter-status">
                    {newsletterMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="footer-watermark" aria-hidden="true">
          connecto.
        </div>
      </footer>

      {/* Interactive Preview Dialogs */}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl bg-white text-gray-900 border border-gray-100 p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold">
              {dialog === "directory" ? "Meet your next collaborator." : "Good things are coming."}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              {dialog === "directory"
                ? "Explore sample verified businesses in the Connecto network."
                : "A new home for ambitious businesses. Connect with founders, exchange services, and discover backers."}
            </DialogDescription>
          </DialogHeader>
          {dialog === "directory" ? (
            <div className="directory-grid mt-4 space-y-3">
              {businesses.map((b) => (
                <div className="directory-profile flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50" key={b.name}>
                  <div className="flex items-center gap-3">
                    <BizLogo mark={b.mark} style={b.style} />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900">{b.name}</h4>
                      <p className="text-xs text-gray-500">
                        {b.type} · {b.location}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={connections.includes(b.name) ? "secondary" : "outline"}
                    onClick={() =>
                      setConnections((prev) =>
                        prev.includes(b.name)
                          ? prev.filter((n) => n !== b.name)
                          : [...prev, b.name]
                      )
                    }
                  >
                    {connections.includes(b.name) ? <Check size={14} /> : <Plus size={14} />}
                    {connections.includes(b.name) ? "Connected" : "Connect"}
                  </Button>
                </div>
              ))}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  Sample connections preview.
                </p>
                <Link
                  href="/directory"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Live Directory <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center mt-3">
              <img
                src={appIcon}
                alt="Connecto app icon"
                width={120}
                height={120}
                className="mx-auto size-28 object-contain mb-3"
              />
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Show your work. Share your ambition.
                <br />
                Find the businesses that help you go further.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  Create Account <ArrowUpRight size={14} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-full border border-gray-200 px-6 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Log In
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
