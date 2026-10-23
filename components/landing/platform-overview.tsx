"use client";

import { ArrowUpRight, Building2, Layers, Users, Rocket, MessagesSquare } from "lucide-react";
import { Button } from "./landing-button";

const appIcon = "/landing/app-icon.png";

const chapters = [
  { icon: Building2, title: "Your business, in one place.", copy: "A company profile brings your story, services, team, and portfolio together. Connecto is built around businesses—not personal résumés." },
  { icon: Layers, title: "Your work starts the conversation.", copy: "Post launches, achievements, and work in progress to the business feed. Give potential partners a reason to discover what you’re building." },
  { icon: Users, title: "Find the strengths you’re missing.", copy: "Discover complementary businesses, explore their services, and connect. Collaborate on projects or agree on an exchange of expertise." },
  { icon: Rocket, title: "Give your idea an audience.", copy: "Publish a startup pitch with your vision and progress. Investors explore ideas and connect with companies to discuss potential backing." },
  { icon: MessagesSquare, title: "Make the next step personal.", copy: "Start a direct conversation, align expectations, and agree on next steps together. Partnerships and investment terms stay between the people involved." },
];

export function PlatformOverview({ explore }: { explore: () => void }) {
  return (
    <section className="section platform-overview" id="platform-overview">
      <div className="container-wide">
        <div className="section-heading">
          <span className="eyebrow">The whole picture</span>
          <h2>One business network.<br /><span className="serif">Every part of your next chapter.</span></h2>
          <p>Presence, partnerships, and pitching belong together. This is how Connecto brings them into one connected experience.</p>
        </div>
        <div className="overview-layout">
          <div className="overview-brand">
            <img src={appIcon} alt="Connecto’s blue sculptural app symbol" width={450} height={450} loading="lazy" />
            <h3>connecto<span className="text-primary">.</span></h3>
            <p>Share. Discover. Connect.<br />Build what comes next, together.</p>
            <Button variant="outline" onClick={explore}>Explore the sample network <ArrowUpRight aria-hidden="true" /></Button>
            <small>Concept preview · Live accounts are not open yet</small>
          </div>
          <ol className="overview-chapters">
            {chapters.map((chapter, i) => (
              <li className="overview-chapter" key={chapter.title}>
                <div className="overview-rule" aria-hidden="true" />
                <div className="overview-number">
                  0{i + 1}
                  <chapter.icon aria-hidden="true" />
                </div>
                <div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="overview-note">Connecto helps businesses and investors meet. It does not guarantee funding or process investment payments.</p>
      </div>
    </section>
  );
}
