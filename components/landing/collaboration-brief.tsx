"use client";

import { Check, ArrowUpRight, ArrowRight } from "lucide-react";
import { Button } from "./landing-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const conversation = "/landing/conversation-3d.png";

const briefs = [
  { id: "launch", label: "A product launch", title: "A good product. A great first impression.", offer: "Product strategy & engineering", need: "Brand identity & launch creative", scope: "A visual identity, launch page, and a shared delivery schedule." },
  { id: "exchange", label: "A service exchange", title: "Your expertise. Their missing piece.", offer: "Website design & development", need: "Photography & campaign content", scope: "Agree on deliverables, usage rights, and what each business contributes." },
  { id: "partner", label: "A long-term partner", title: "Different strengths. One shared direction.", offer: "Marketing strategy & client relationships", need: "A specialist product studio", scope: "Define responsibilities, communication, and milestones for the first project." },
];

export function CollaborationBrief({ explore }: { explore: () => void }) {
  return (
    <section className="section collaboration-section" id="collaboration-brief">
      <div className="container-wide">
        <div className="brief-heading section-heading">
          <span className="eyebrow">From connection to collaboration</span>
          <h2>Bring a little clarity.<br /><span className="serif">Build something better.</span></h2>
          <p>The strongest partnerships start with what you bring, what you need, and what success looks like.</p>
        </div>
        <div className="brief-layout">
          <div className="brief-art">
            <img src={conversation} alt="Two blue sculptural speech bubbles representing a business conversation" width={450} height={450} loading="lazy" />
            <span className="serif">Let’s make it mutual.</span>
          </div>
          <Tabs defaultValue="launch" className="brief-workspace">
            <TabsList aria-label="Sample collaboration briefs" className="brief-tabs">
              {briefs.map(brief => <TabsTrigger value={brief.id} key={brief.id}>{brief.label}</TabsTrigger>)}
            </TabsList>
            {briefs.map(brief => (
              <TabsContent value={brief.id} key={brief.id} className="brief-panel">
                <span className="tile-kicker">Illustrative collaboration brief</span>
                <h3>{brief.title}</h3>
                <div className="brief-exchange">
                  <div><span>We bring</span><strong>{brief.offer}</strong></div>
                  <ArrowRight aria-hidden="true" />
                  <div><span>We’re looking for</span><strong>{brief.need}</strong></div>
                </div>
                <p>{brief.scope}</p>
                <ul>
                  <li><Check aria-hidden="true" />Agree on scope</li>
                  <li><Check aria-hidden="true" />Set a timeline</li>
                  <li><Check aria-hidden="true" />Define the next step</li>
                </ul>
              </TabsContent>
            ))}
            <Button variant="outline" onClick={explore}>Find a complementary business <ArrowUpRight aria-hidden="true" /></Button>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
