"use client";

import { useState } from "react";
import { ArrowUpRight, Bookmark, Check, MessageCircle, Rocket, Search, TrendingUp, ArrowRight, Lightbulb, Eye, Users } from "lucide-react";
import { Button } from "./landing-button";
import { Brand, BizLogo } from "./product-showcase";

const idea = "/landing/pitch-bridge-sculpture.png";
const growth = "/landing/investor-growth.png";
const rocket = "/landing/startup-rocket.png";
const browser = "/landing/tech-browser.png";

const pitches = [
  { name: "Forma Labs", mark: "f", category: "Software", title: "A simpler way for small teams to build.", copy: "We’re creating a workspace that brings scattered tools together. Our working prototype is ready, and we’re looking for investors who share our vision.", stage: "Pre-seed", image: browser },
  { name: "Orbit Ventures", mark: "o", category: "Climate", title: "Small changes. A cleaner tomorrow.", copy: "A reusable delivery system designed for independent shops. We’re sharing our first pilot and connecting with investors who understand sustainable commerce.", stage: "Seed", image: rocket },
];

export function PlatformFeedPreview({ explore }: { explore: () => void }) {
  const [filter, setFilter] = useState("All ideas");
  const [saved, setSaved] = useState<string[]>([]);

  return (
    <div className="investment-feed">
      <div className="feed-preview-top">
        <Brand />
        <span>Ideas worth a closer look.</span>
        <span className="preview-status">Sample network</span>
      </div>
      <div className="feed-preview-layout">
        <aside className="pitch-sidebar">
          <div className="pitch-sidebar-title"><Search /> Discover</div>
          <Button variant="ghost" onClick={() => setFilter("All ideas")} className={filter === "All ideas" ? "selected" : ""}><Rocket /> Startup pitches</Button>
          <Button variant="ghost" onClick={explore}><MessageCircle /> Connections</Button>
          <div className="investor-profile">
            <BizLogo mark="n" />
            <b>Northstar Capital</b>
            <small>Investor · Early-stage teams</small>
            <p>Looking for ambitious founders building useful products.</p>
          </div>
        </aside>
        <div className="pitch-feed">
          <div className="pitch-feed-heading">
            <div>
              <span className="tile-kicker">The idea feed</span>
              <h3>Your next conviction starts here.</h3>
            </div>
            <TrendingUp />
          </div>
          <div className="pitch-filters" aria-label="Filter sample ideas">
            {["All ideas", "Software", "Climate"].map(f => (
              <Button key={f} variant="outline" aria-pressed={filter === f} onClick={() => setFilter(f)} className={filter === f ? "selected" : ""}>{f}</Button>
            ))}
          </div>
          {pitches.filter(p => filter === "All ideas" || p.category === filter).map(p => (
            <article className="pitch-post" key={p.name}>
              <div className="pitch-author">
                <BizLogo mark={p.mark} />
                <div><b>{p.name}</b><small>{p.category} · Pitching an idea</small></div>
                <span>{p.stage}</span>
              </div>
              <h4>{p.title}</h4>
              <p>{p.copy}</p>
              <div className="pitch-post-art">
                <div>
                  <span>OPEN TO INVESTOR CONVERSATIONS</span>
                  <strong>{p.category === "Software" ? "Built for the next chapter." : "Better business. Lighter footprint."}</strong>
                </div>
                <img src={p.image} alt={`${p.category} startup pitch artwork`} width={240} height={240} loading="lazy" />
              </div>
              <div className="pitch-post-actions">
                <Button variant="ghost" onClick={explore}><MessageCircle /> Connect to discuss</Button>
                <Button variant="ghost" aria-pressed={saved.includes(p.name)} aria-label={`${saved.includes(p.name) ? "Unsave" : "Save"} ${p.name} idea`} onClick={() => setSaved(s => s.includes(p.name) ? s.filter(n => n !== p.name) : [...s, p.name])}>{saved.includes(p.name) ? <Check /> : <Bookmark />}{saved.includes(p.name) ? "Saved" : "Save idea"}</Button>
              </div>
            </article>
          ))}
        </div>
        <aside className="investor-discovery">
          <img src={growth} alt="Blue glass growth sculpture" width={210} height={210} loading="lazy" />
          <span className="tile-kicker">A shared ambition</span>
          <h4>Discover the idea.<br />Meet the business.</h4>
          <p>Browse pitches, understand the vision, and start a conversation with the team behind it.</p>
          <Button onClick={explore}>Explore connections <ArrowUpRight /></Button>
          <small>Sample profiles and pitches.</small>
        </aside>
      </div>
    </div>
  );
}

export function InvestorSection({ explore }: { explore: () => void }) {
  const [perspective, setPerspective] = useState<"founder" | "investor">("founder");
  const isFounder = perspective === "founder";
  const details = isFounder ? [
    { title: "Your vision, clearly told.", copy: "Share the problem, your solution, and why your company is the one to build it." },
    { title: "Progress that speaks for itself.", copy: "Bring your prototype, milestones, and team into the story. Give your ambition substance." },
    { title: "The right people in the room.", copy: "Connect with investors who see the potential and start a conversation about what comes next." },
  ] : [
    { title: "Discover beyond the pitch deck.", copy: "Explore company ideas by interest and stage, with the work and people behind them in view." },
    { title: "Follow the company’s momentum.", copy: "Look at prototypes, milestones, and shared updates to understand how the vision is taking shape." },
    { title: "Turn curiosity into a conversation.", copy: "Connect directly with the company, ask your questions, and explore investing on your own terms." },
  ];

  return (
    <section className="section investor-section pitching-revamp" id="investors">
      <div className="container-wide">
        <div className="section-heading pitch-editorial-heading">
          <span className="eyebrow">Founders meet believers</span>
          <h2>You see an idea.<br /><span className="serif">They see the future.</span></h2>
          <p>Put your ambition in the spotlight. Meet the investors who see what you see — and what comes next.</p>
        </div>
        <div className="pitch-theater">
          <div className="pitch-stage">
            <div className="pitch-stage-top"><span><Lightbulb /> AMBITION, MEET CONVICTION.</span><span>01 — 02</span></div>
            <img className="pitch-stage-art" src={idea} alt="A founder and investor connected by a blue sculptural bridge beneath a glass lightbulb with a growing seed" width={1536} height={1024} loading="lazy" />
            <div className="pitch-art-caption"><span>THE FOUNDER<br /><b>A vision worth sharing.</b></span><ArrowRight /><span>THE INVESTOR<br /><b>A future worth exploring.</b></span></div>
          </div>
          <div className="pitch-perspective">
            <div className="pitch-role-switch" role="tablist" aria-label="Pitching perspective">
              <Button id="founder-perspective" role="tab" aria-selected={isFounder} aria-controls="pitch-perspective-panel" variant={isFounder ? "default" : "ghost"} onClick={() => setPerspective("founder")}><Rocket /> For founders</Button>
              <Button id="investor-perspective" role="tab" aria-selected={!isFounder} aria-controls="pitch-perspective-panel" variant={!isFounder ? "default" : "ghost"} onClick={() => setPerspective("investor")}><TrendingUp /> For investors</Button>
            </div>
            <div id="pitch-perspective-panel" role="tabpanel" aria-labelledby={`${perspective}-perspective`} className="pitch-perspective-panel" key={perspective}>
              <span className="tile-kicker">{isFounder ? "MAKE YOUR AMBITION VISIBLE" : "FIND YOUR NEXT CONVICTION"}</span>
              <h3>{isFounder ? <>You bring the idea.<br />We open the room.</> : <>See the potential.<br />Meet the people.</>}</h3>
              <div className="pitch-perspective-details">
                {details.map((detail, i) => (
                  <div key={detail.title}><span>0{i + 1}</span><div><h4>{detail.title}</h4><p>{detail.copy}</p></div></div>
                ))}
              </div>
            </div>
            <Button className="pitch-explore" onClick={explore}>{isFounder ? "Explore sample company pitches" : "Discover the sample pitch network"}<ArrowUpRight /></Button>
          </div>
        </div>
        <div className="pitch-path">
          {[
            { icon: Rocket, title: "Publish your pitch", copy: "The idea, the progress, the possibility." },
            { icon: Eye, title: "Get on the right radar", copy: "Investors discover businesses worth a closer look." },
            { icon: Users, title: "Start something together", copy: "Connect directly and explore the next chapter." },
          ].map((step, i) => (
            <div key={step.title}>
              <step.icon />
              <div><span>0{i + 1}</span><h4>{step.title}</h4><p>{step.copy}</p></div>
              {i < 2 && <ArrowRight className="pitch-path-arrow" />}
            </div>
          ))}
        </div>
        <p className="sample-note pitch-disclaimer">Sample pitches only. Connecto enables discovery and conversations; companies and investors agree their own investment terms. No guaranteed funding or on-platform investment payments.</p>
      </div>
    </section>
  );
}
