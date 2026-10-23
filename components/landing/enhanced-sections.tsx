"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Globe2,
  Heart,
  Layers,
  MessageCircle,
  Palette,
  Plus,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "./landing-button";
import { BizLogo, businesses } from "./product-showcase";
import { PlatformFeedPreview } from "./investor-preview";

const rocket = "/landing/startup-rocket.png";
const browser = "/landing/tech-browser.png";
const brush = "/landing/creative-brush.png";
const megaphone = "/landing/agency-megaphone.png";
const growth = "/landing/investor-growth.png";
const idea = "/landing/pitch-idea.png";
const conversation = "/landing/conversation-3d.png";
const links = "/landing/connect-links.png";
const appIcon = "/landing/app-icon.png";
const founder = "/landing/founder.jpg";
const male = "/landing/founder-male.jpg";
const creative = "/landing/founder-creative.jpg";

function Heading({ label, title, copy }: { label: string; title: React.ReactNode; copy: string }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{label}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

export function FeatureBento() {
  return (
    <section className="section container-wide" id="features">
      <Heading
        label="Good things, all in one place"
        title={<>A bigger stage.<br /><span className="serif">A more meaningful network.</span></>}
        copy="Your work, your ideas, and your next connection. Everything that helps a business move forward, together."
      />
      <div className="editorial-bento reference-bento">
        <article className="detail-tile reference-presence">
          <span className="reference-brand"><Layers /> Your presence</span>
          <div>
            <h3>One profile.<br />Every possibility.</h3>
            <p>Your story, services, and strongest work. A business worth getting to know.</p>
          </div>
        </article>
        <article className="detail-tile reference-feature">
          <div className="reference-founder">
            <img src={male} alt="Illustrative founder portrait" width={768} height={1024} loading="lazy" />
          </div>
          <div className="reference-feature-copy">
            <span className="reference-brand"><Users /> Built for together</span>
            <h3>You bring the vision.<br /><span className="serif">Find who brings the rest.</span></h3>
            <p>Meet complementary businesses, exchange expertise, and turn a conversation into work you’re proud to share.</p>
            <span className="reference-footer">Good businesses. Better connections. <ArrowUpRight /></span>
          </div>
        </article>
        <article className="detail-tile reference-photo">
          <img src={founder} alt="Illustrative creative business founder" width={768} height={1024} loading="lazy" />
          <span className="reference-brand"><Layers /> Share your work</span>
          <div>
            <h3>Small updates.<br />Big visibility.</h3>
            <p>Give your launches, milestones, and work a life beyond the project folder.</p>
          </div>
        </article>
        <article className="detail-tile reference-pitch">
          <span className="reference-brand"><Sparkles /> Pitch your vision</span>
          <div>
            <h3>Big ideas.<br /><span className="serif">Meet believers.</span></h3>
            <p>Publish your pitch and progress. Get discovered by investors who see the possibility.</p>
          </div>
        </article>
        <article className="detail-tile reference-photo">
          <img src={creative} alt="Illustrative independent studio founder" width={768} height={1024} loading="lazy" />
          <span className="reference-brand"><MessageCircle /> Make a connection</span>
          <div>
            <h3>A simple hello.<br />A new chapter.</h3>
            <p>Talk directly with partners and investors. Explore what comes next, together.</p>
          </div>
        </article>
      </div>
    </section>
  );
}

const steps = [
  {
    number: "01",
    label: "Make yourself known",
    title: (
      <>
        Your story.
        <br />
        <span className="serif">Your business home.</span>
      </>
    ),
    copy: "Create a profile that feels like your business. Share your purpose, the services you offer, and the work you want the world to see.",
    points: [
      "Showcase your best projects",
      "Tell the story behind your team",
      "Let partners know what you offer",
    ],
    image: browser,
    stamp: "A little introduction. A lasting impression.",
  },
  {
    number: "02",
    label: "Share what you’re building",
    title: (
      <>
        Small updates.
        <br />
        <span className="serif">Big visibility.</span>
      </>
    ),
    copy: "Give your work a life beyond the project folder. Share launches, milestones, and lessons with businesses who understand the journey.",
    points: [
      "Celebrate the wins",
      "Share work in progress",
      "Build a presence, one post at a time",
    ],
    image: rocket,
    stamp: "Your latest work might be their next inspiration.",
  },
  {
    number: "03",
    label: "Find your kind of ambitious",
    title: (
      <>
        Different skills.
        <br />
        <span className="serif">Shared energy.</span>
      </>
    ),
    copy: "Explore businesses that think like you and bring something different to the table. Find complementary services and a shared drive to build.",
    points: [
      "Discover teams across industries",
      "Explore portfolios and services",
      "Connect with businesses that fit",
    ],
    image: brush,
    stamp: "Good partners bring what you’re missing.",
  },
  {
    number: "04",
    label: "Turn hello into possibility",
    title: (
      <>
        A conversation.
        <br />
        <span className="serif">A new beginning.</span>
      </>
    ),
    copy: "Skip the cold pitch. Start with genuine interest, talk about what you need, and explore what you could achieve together.",
    points: [
      "Start a meaningful conversation",
      "Discuss goals and expectations",
      "Find the shape of your collaboration",
    ],
    image: conversation,
    stamp: "The best partnerships start human.",
  },
  {
    number: "05",
    label: "Build something together",
    title: (
      <>
        Exchange skills.
        <br />
        <span className="serif">Grow your circle.</span>
      </>
    ),
    copy: "Agree on a project or a service exchange. Bring your strengths together, make something worth sharing, and let the next connection begin.",
    points: [
      "Align scope and deliverables",
      "Exchange complementary expertise",
      "Share the work you made together",
    ],
    image: growth,
    stamp: "One collaboration. A world of what’s next.",
  },
];

export function FullPageJourney() {
  return (
    <section className="journey-full" id="how-it-works">
      <div className="journey-full-sticky">
        <div className="journey-header container-wide">
          <span className="eyebrow">How a connection becomes something more</span>
          <span className="journey-position">01 / 05</span>
        </div>
        <div className="journey-full-track">
          {steps.map((step) => (
            <article className="journey-page" key={step.number}>
              <div className="journey-page-inner container-wide">
                <div className="journey-page-copy">
                  <div className="tile-kicker">
                    {step.number} — {step.label}
                  </div>
                  <h2>{step.title}</h2>
                  <p>{step.copy}</p>
                  <ul>
                    {step.points.map((point) => (
                      <li key={point}>
                        <Check />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="journey-page-visual">
                  <span className="journey-giant-number">{step.number}</span>
                  <img
                    src={step.image}
                    alt="Connecto sculptural connection artwork"
                    width={450}
                    height={450}
                    loading="lazy"
                  />
                  <div className="journey-glass-note">
                    <Sparkles />
                    <span>{step.stamp}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="journey-full-progress container-wide">
          {steps.map((s) => (
            <span key={s.number}>
              <i />
              <small>
                {s.number} — {s.label}
              </small>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Opportunities({ explore }: { explore: () => void }) {
  return (
    <section className="section opportunity-section" id="opportunities">
      <div className="container-wide">
        <Heading
          label="Opportunity looks good on you"
          title={<>There’s a perfect fit<br /><span className="serif">somewhere in your feed.</span></>}
          copy="A new partner. An idea worth backing. A conversation that changes what’s next. See how businesses and investors discover each other on Connecto."
        />
        <PlatformFeedPreview explore={explore} />
      </div>
    </section>
  );
}

export function CommunityBento({ explore }: { explore: () => void }) {
  const groups = [
    {
      title: "Startups",
      subtitle: "Big ideas. Early chapters.",
      copy: "Find a creative partner, a product collaborator, or an investor who believes in your next chapter.",
      icon: Rocket,
      class: "startup-community",
      tags: ["Launch together", "Pitch your idea"],
      image: rocket,
    },
    {
      title: "Creative studios",
      subtitle: "Independent minds. Shared magic.",
      copy: "Meet teams who need your perspective. Bring brands, experiences, and ambitious projects to life.",
      icon: Palette,
      class: "studio-community",
      tags: ["Branding", "Digital experiences"],
      image: brush,
    },
    {
      title: "Tech teams",
      subtitle: "Builders meet dreamers.",
      copy: "Connect with businesses who have the vision. Bring the engineering expertise that makes it happen.",
      icon: Code2,
      class: "tech-community",
      tags: ["Products", "Development"],
      image: browser,
    },
    {
      title: "Agencies",
      subtitle: "A bigger circle of expertise.",
      copy: "Expand your capabilities without doing it all yourself. Find specialist partners for your next client project.",
      icon: TrendingUp,
      class: "agency-community",
      tags: ["Marketing", "Strategy"],
      image: megaphone,
    },
    {
      title: "Small businesses",
      subtitle: "Local roots. Open horizons.",
      copy: "Share what makes your business special and discover useful partnerships, near you and beyond.",
      icon: Globe2,
      class: "small-community",
      tags: ["Services", "New connections"],
      image: conversation,
    },
    {
      title: "Investors",
      subtitle: "Conviction meets ambition.",
      copy: "Discover company pitches, explore the ideas behind them, and connect directly with teams to discuss investing in their projects.",
      icon: TrendingUp,
      class: "investor-community",
      tags: ["Discover pitches", "Back ambitious teams"],
      image: growth,
    },
  ];

  return (
    <section className="section community-section community-editorial" id="community">
      <div className="container-wide">
        <Heading
          label="Your kind of people. Your kind of ambition."
          title={
            <>
              Different businesses.
              <br />
              <span className="serif">The same drive to build.</span>
            </>
          }
          copy="From a two-person studio to a growing product team, there’s a place for your business—and someone who needs what you do."
        />
        <div className="community-bento community-banners">
          {groups.map((g, i) => (
            <article className={`community-tile community-banner banner-${i}`} key={g.title}>
              <div className="community-banner-copy">
                <span className="tile-kicker"><g.icon aria-hidden="true" /> THE CONNECTO COLLECTIVE / 0{i + 1}</span>
                <h3>{g.title}</h3>
                <span className="community-subtitle serif">{g.subtitle}</span>
                <p>{g.copy}</p>
                <div className="community-specialties">{g.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
                <Button variant="ghost" onClick={explore} aria-label={`Explore ${g.title}`}>Explore {g.title.toLowerCase()} <ArrowUpRight /></Button>
              </div>
              <div className="community-tile-art">
                <img src={g.image} alt={`${g.title} blue-and-white sculpture`} width={380} height={380} loading="lazy" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const stories = [
  {
    name: "Arjun Mehta",
    role: "Co-founder, Orbit",
    quote: "Our best collaboration started with a simple hello.",
    metric: "2.5",
    caption: "hours saved on outreach",
    image: male,
    tone: "blue",
  },
  {
    name: "Sophia Patel",
    role: "Co-founder, Syntra",
    quote: "We found more than a partner. We found a team that gets what we’re building.",
    metric: "3x",
    caption: "more meaningful connections",
    image: founder,
    tone: "sky",
  },
  {
    name: "Maya Carter",
    role: "Founder, Bloom",
    quote: "Less chasing leads. More building things with good people.",
    metric: "34",
    caption: "new business connections",
    image: creative,
    tone: "blue",
  },
  { name: "Daniel Brooks", role: "Founder, Forma Labs", quote: "Sharing our vision brought the right investor conversation closer.", metric: "1", caption: "shared vision, new possibilities", image: male, tone: "sky" },
  { name: "Emma Wilson", role: "Partner, Northstar Capital", quote: "The idea matters. Getting to know the team matters just as much.", metric: "12", caption: "ideas on our watchlist", image: founder, tone: "blue" },
  { name: "Nina Shah", role: "Founder, Fieldwork", quote: "Our next chapter began with a business that brought what we were missing.", metric: "4", caption: "complementary collaborations", image: creative, tone: "sky" },
];

export function AnimatedTestimonials() {
  const [active, setActive] = useState(1);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    const timer = setInterval(() => setActive((a) => (a + 1) % stories.length), 4500);
    return () => clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    let cancelled = false;
    const animations: { kill: () => void }[] = [];

    import("gsap").then(({ gsap }) => {
      if (cancelled || !root.current) return;
      const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const portraitWidth = getComputedStyle(root.current).getPropertyValue("--portrait-width").trim() || "44%";
      const scroller = root.current;

      scroller.querySelectorAll<HTMLElement>(".story-card").forEach((card) => {
        const isActive = Number(card.dataset["storyIndex"]) === active;
        animations.push(gsap.to(card, { flexGrow: isActive ? 2.35 : 1, duration: reduced ? 0 : 1.05, ease: "power3.inOut", overwrite: "auto" }));
        animations.push(gsap.to(card.querySelector(".story-portrait"), { width: isActive ? portraitWidth : "0%", opacity: isActive ? 1 : 0, duration: reduced ? 0 : 1.05, ease: "power3.inOut", overwrite: "auto" }));
        if (isActive && !reduced) {
          animations.push(gsap.fromTo(card.querySelector(".story-portrait img"), { scale: 1.06 }, { scale: 1, duration: 1.3, ease: "power2.out", overwrite: "auto" }));
          animations.push(gsap.fromTo(card.querySelector(".story-shine"), { xPercent: -180 }, { xPercent: 350, duration: 2, delay: 0.55, ease: "power2.inOut", overwrite: "auto" }));
        }
      });
    });

    return () => {
      cancelled = true;
      animations.forEach((animation) => animation.kill());
    };
  }, [active]);

  return (
    <section className="section testimonials container-wide" id="stories">
      <Heading
        label="Community stories"
        title="What Teams Are Saying"
        copy="Independent businesses. Real collaborations. The kind of momentum that happens when you don't build alone."
      />
      <div
        className="animated-story-grid story-reference"
        role="region"
        aria-label="Community testimonials"
        ref={root}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={(e) => {
          setPaused(true);
          const card = (e.target as HTMLElement).closest(".story-card");
          if (card && root.current) {
            const index = Number((card as HTMLElement).dataset["storyIndex"]);
            if (Number.isInteger(index)) setActive(index);
          }
        }}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
        }}
      >
        {stories.map((s, i) =>
          i >= Math.floor(active / 3) * 3 && i < Math.floor(active / 3) * 3 + 3 ? (
            <article
              className={`story-card story-${s.tone} ${i === active ? "is-active" : ""}`}
              key={s.name}
              data-story-index={i}
            >
              <div className="story-shine" />
              <div className="story-portrait" aria-hidden={i !== active}>
                <img
                  src={s.image}
                  alt={i === active ? `Illustrative portrait of ${s.name}` : ""}
                  width={768}
                  height={1024}
                  loading="lazy"
                />
                <div className="story-person">
                  {s.name}
                  <small>{s.role}</small>
                </div>
              </div>
              <div className="story-body">
                <Button
                  variant="ghost"
                  className="story-select"
                  onClick={() => setActive(i)}
                  aria-label={`Show ${s.name}'s story`}
                  aria-pressed={i === active}
                >
                  <span className="quote-mark">”</span>
                </Button>
                <p>“{s.quote}”</p>
                <div className="quote-metric">
                  <strong>{s.metric}</strong>
                  <small>{s.caption}</small>
                </div>
              </div>
            </article>
          ) : null
        )}
      </div>
      <div className="story-controls">
        {stories.map((s, i) => (
          <Button
            variant="ghost"
            size="icon"
            key={s.name}
            aria-label={`Select ${s.name}'s testimonial`}
            aria-pressed={i === active}
            onClick={() => {
              setPaused(true);
              setActive(i);
            }}
          >
            <span className={i === active ? "story-dot active" : "story-dot"} />
          </Button>
        ))}
        <Button variant="ghost" onClick={() => setPaused(!paused)} className="text-xs">
          {paused ? "Play stories" : "Pause stories"}
        </Button>
      </div>
      <p className="sample-note">
        Illustrative community stories and sample results. Not verified customer testimonials.
      </p>
    </section>
  );
}

export function WorkInPublic({ explore }: { explore: () => void }) {
  const [selected, setSelected] = useState(0);
  const details = [
    { title: "The vision", heading: "See the problem. Understand the possibility.", copy: "Explore what a company is solving, who it is building for, and why its approach matters. A clear pitch is the beginning of an informed conversation.", icon: Sparkles },
    { title: "The progress", heading: "Look beyond an idea. Follow the momentum.", copy: "Company updates, prototypes, and milestones bring a pitch into focus. Discover the work behind the ambition before you reach out.", icon: TrendingUp },
    { title: "The team", heading: "Meet the people bringing the vision to life.", copy: "Get to know the business through its profile and work. Connect directly to ask questions and explore whether your interests align.", icon: Users },
  ];
  const current = details[selected];
  if (!current) return null;

  return (
    <section className="section investor-perspective research-editorial" id="show-your-work">
      <div className="container-wide">
        <Heading
          label="Beyond the pitch"
          title={<>More than a pitch.<br /><span className="serif">A whole lot of potential.</span></>}
          copy="The story doesn’t stop at the idea. Discover the work, the momentum, and the people making it real."
        />
        <div className="investor-research-layout">
          <div className="investor-research-art">
            <div className="research-dossier-heading">
              <span className="tile-kicker">LOOK A LITTLE CLOSER</span>
              <span>01 / 03</span>
            </div>
            <div className="research-art-scene">
              <span className="research-art-word" aria-hidden="true">Potential.</span>
              <img src={growth} alt="Large blue glass growth sculpture representing a company's potential" width={460} height={460} loading="lazy" />
            </div>
            <div className="research-evidence" key={selected}>
              <span>0{selected + 1} / {current.title} · Sample company</span>
              <strong>{["A clearer workspace for small teams", "Working prototype shared", "Meet the team behind Forma"][selected]}</strong>
              <p>{["One problem. A focused solution.", "From an idea to something you can explore.", "The people and work behind the ambition."][selected]}</p>
            </div>
          </div>
          <div className="investor-research-copy">
            <div className="research-tabs" role="tablist" aria-label="Explore a company pitch">
              {details.map((d, i) => (
                <Button key={d.title} role="tab" id={`research-tab-${i}`} aria-controls="research-panel" aria-selected={selected === i} variant={selected === i ? "default" : "outline"} onClick={() => setSelected(i)}>
                  <d.icon />{d.title}
                </Button>
              ))}
            </div>
            <div className="research-panel" id="research-panel" role="tabpanel" aria-labelledby={`research-tab-${selected}`} key={selected}>
              <span className="tile-kicker">0{selected + 1} / Investor perspective</span>
              <h3>{current.heading}</h3>
              <p>{current.copy}</p>
            </div>
            <Button onClick={explore}>Discover the sample businesses <ArrowUpRight /></Button>
            <p className="sample-note">Connections open the conversation. Investors and companies handle their own due diligence and agree investment terms independently.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ConnectionLoop({ explore }: { explore: () => void }) {
  return (
    <section className="section container-wide connection-loop" id="network-effect">
      <Heading
        label="The good kind of ripple effect"
        title={<>One hello.<br /><span className="serif">More than one possibility.</span></>}
        copy="A connection becomes a conversation. A conversation becomes a collaboration. The work you make together opens the next door."
      />
      <div className="loop-layout">
        <div className="loop-visual">
          <div className="loop-ring ring-one" />
          <div className="loop-ring ring-two" />
          <img src={links} alt="A network of shared opportunity" width={320} height={320} loading="lazy" />
          <div className="loop-label label-one"><Users />A new connection</div>
          <div className="loop-label label-two"><MessageCircle />A shared idea</div>
          <div className="loop-label label-three"><Rocket />A launch together</div>
        </div>
        <div className="loop-copy">
          {[
            { icon: Users, title: "Build relationships, not a contact list.", copy: "Stay connected to businesses whose work and ambition you believe in." },
            { icon: Zap, title: "Let different strengths do their thing.", copy: "Bring your best expertise. Find someone who brings what you don’t." },
            { icon: TrendingUp, title: "Make the next opportunity easier to find.", copy: "Every project you share helps another business discover what you can do." },
          ].map((item) => (
            <div key={item.title}>
              <item.icon />
              <div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
            </div>
          ))}
          <Button variant="link" onClick={explore}>See who’s in your next chapter <ArrowUpRight /></Button>
        </div>
      </div>
    </section>
  );
}
