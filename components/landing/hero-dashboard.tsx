"use client";

import { useState } from "react";
import { ArrowUpRight, Bookmark, Check, Compass, Heart, Layers, MapPin, Plus, Rocket, Search, Sparkles, Users } from "lucide-react";
import { Button } from "./landing-button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BizLogo, businesses } from "./product-showcase";

const appIcon = "/landing/app-icon.png";
const pitchIdea = "/landing/pitch-idea.png";

function HeroWorkspace() {
  const [view, setView] = useState("feed");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connections, setConnections] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [pitchSaved, setPitchSaved] = useState(false);
  const [status, setStatus] = useState("");

  const connect = (name: string) => {
    const exists = connections.includes(name);
    setConnections(previous => exists ? previous.filter(item => item !== name) : [...previous, name]);
    setStatus(exists ? `Sample connection with ${name} removed.` : `Sample connection with ${name} added. No request was sent.`);
  };

  return (
    <section className="hero-workspace" aria-label="Connecto sample business workspace">
      <header className="hd-topbar">
        <div className="hd-wordmark"><span aria-hidden="true">✳</span> connecto<span className="text-primary">.</span></div>
        <span className="hd-breadcrumb">Community <span aria-hidden="true">/</span> Your workspace</span>
        <span className="hd-demo"><span aria-hidden="true" />Sample preview</span>
      </header>
      <Tabs value={view} onValueChange={setView} className="hd-layout" orientation="vertical">
        <aside className="hd-sidebar" aria-label="Business workspace navigation">
          <div className="hd-company"><BizLogo mark="a" /><div><strong>Acme Studio</strong><span>Design that moves you.</span></div></div>
          <span className="hd-overline">YOUR WORKSPACE</span>
          <TabsList className="hd-navigation" aria-label="Explore the sample workspace">
            <TabsTrigger value="feed"><Layers aria-hidden="true" /> Your feed</TabsTrigger>
            <TabsTrigger value="businesses"><Compass aria-hidden="true" /> Businesses</TabsTrigger>
            <TabsTrigger value="pitches"><Rocket aria-hidden="true" /> Startup pitches</TabsTrigger>
          </TabsList>
          <div className="hd-sidebar-bottom"><div className="hd-network-icon"><Users aria-hidden="true" /></div><strong>Better, together.</strong><p>A little visibility.<br />A world of opportunity.</p><span className="hd-profile-tag">Business account</span></div>
        </aside>
        <div className="hd-center product-feed">
          <div className="hd-welcome"><span className="hd-overline">YOUR NEXT CHAPTER STARTS HERE</span><h2>{view === "feed" ? "Good morning, Acme." : view === "businesses" ? "Find your next partner." : "Big ideas. Real potential."}</h2><p>{view === "feed" ? "Fresh work, bright ideas, and the people building them." : view === "businesses" ? "Meet businesses with something great to bring to the table." : "Discover the teams turning a vision into something real."}</p></div>
          <TabsContent value="feed" className="hd-panel">
            <div className="hd-feed-label"><h3>Your daily spark</h3><span>From the community</span></div>
            <article className="hd-post">
              <div className="hd-author"><BizLogo mark="o" style="ink" /><div><h3>Orbit Studio <Check aria-label="Verified business" /></h3><p>Brand & digital design · 2h ago</p></div><span className="hd-post-type">New work</span></div>
              <p className="hd-post-copy">A new identity. A bigger ambition. Here’s what happens when two businesses build something together.</p>
              <div className="hd-art"><div><span>ORBIT STUDIO × FORMA LABS</span><h3>Good things<br />take shape.</h3><p>Built together. Made to stand out.</p></div><img src={appIcon} alt="Sculptural blue app icon from Orbit Studio’s branding project" width={250} height={250} /></div>
              <div className="hd-post-footer"><Button variant="ghost" aria-label={liked ? "Unlike Orbit Studio’s post" : "Like Orbit Studio’s post"} aria-pressed={liked} onClick={() => setLiked(!liked)}><Heart aria-hidden="true" fill={liked ? "currentColor" : "none"} />{liked ? "129" : "128"}</Button><span>24 conversations</span><Button variant="ghost" className="hd-save" aria-label={saved ? "Unsave Orbit Studio’s post" : "Save Orbit Studio’s post"} aria-pressed={saved} onClick={() => { setSaved(!saved); setStatus(saved ? "Sample post removed from saved posts." : "Sample post saved."); }}><Bookmark aria-hidden="true" fill={saved ? "currentColor" : "none"} />{saved ? "Saved" : "Save"}</Button></div>
            </article>
          </TabsContent>
          <TabsContent value="businesses" className="hd-panel">
            <div className="hd-search"><Search aria-hidden="true" /><Input aria-label="Search sample businesses" placeholder="Search businesses or services" value={query} onChange={event => setQuery(event.target.value)} /></div>
            <div className="hd-directory">{businesses.filter(business => `${business.name} ${business.type}`.toLowerCase().includes(query.toLowerCase())).map(business => <article className="hd-business" key={business.name}><BizLogo mark={business.mark} /><div><h3>{business.name}</h3><p>{business.type}</p><span><MapPin aria-hidden="true" />{business.location}</span></div><Button variant="outline" aria-label={`${connections.includes(business.name) ? "Remove sample connection with" : "Connect with"} ${business.name}`} aria-pressed={connections.includes(business.name)} onClick={() => connect(business.name)}>{connections.includes(business.name) ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}{connections.includes(business.name) ? "Connected" : "Connect"}</Button></article>)}</div>
            {!businesses.some(business => `${business.name} ${business.type}`.toLowerCase().includes(query.toLowerCase())) && <p className="hd-empty" role="status">No sample businesses match “{query}”.</p>}
          </TabsContent>
          <TabsContent value="pitches" className="hd-panel">
            <article className="hd-pitch-detail"><div className="hd-pitch-art"><img src={pitchIdea} alt="Blue 3D lightbulb representing a startup idea" width={220} height={220} /><span className="hd-post-type">SEED STAGE · SAMPLE PITCH</span></div><h3>A brighter way to build.</h3><p>Forma Labs is building a shared workspace that helps small teams bring their best ideas to life.</p><div className="hd-pitch-tags"><span>Productivity</span><span>Open to investor conversations</span></div><div className="hd-pitch-actions"><Button onClick={() => connect("Forma Labs")} aria-pressed={connections.includes("Forma Labs")}>{connections.includes("Forma Labs") ? "Connected" : "Meet the business"}<ArrowUpRight aria-hidden="true" /></Button><Button variant="outline" aria-pressed={pitchSaved} onClick={() => { setPitchSaved(!pitchSaved); setStatus(pitchSaved ? "Sample pitch unsaved." : "Sample pitch saved."); }}><Bookmark aria-hidden="true" />{pitchSaved ? "Saved" : "Save pitch"}</Button></div></article>
          </TabsContent>
          <p className="sr-only" role="status" aria-live="polite">{status}</p>
        </div>
        <aside className="hd-right" aria-label="Community suggestions">
          <div className="hd-right-heading"><h3>Made for your network</h3><Users aria-hidden="true" /></div>
          <p className="hd-right-intro">Good businesses. Great chemistry.</p>
          {businesses.slice(1, 3).map(business => <div className="hd-suggestion" key={business.name}><BizLogo mark={business.mark} /><div><strong>{business.name}</strong><span>{business.type}</span></div><Button variant="outline" size="icon" aria-label={`${connections.includes(business.name) ? "Remove sample connection with" : "Connect with"} ${business.name}`} aria-pressed={connections.includes(business.name)} onClick={() => connect(business.name)}>{connections.includes(business.name) ? <Check /> : <Plus />}</Button></div>)}
          <div className="hd-opportunity"><span className="hd-overline"><Sparkles aria-hidden="true" /> THE NEXT BIG THING</span><img src={pitchIdea} alt="" width={160} height={160} /><h3>Small beginnings.<br />Big possibilities.</h3><p>Meet ambitious teams looking for believers, not just backers.</p><Button variant="outline" onClick={() => setView("pitches")}>Discover pitches <ArrowUpRight aria-hidden="true" /></Button></div>
          <span className="hd-sample-note">Illustrative businesses and activity</span>
        </aside>
      </Tabs>
    </section>
  );
}

export function HeroDashboard() {
  return <div className="hero-dashboard-scroll"><div className="hero-dashboard-tilt"><HeroWorkspace /></div></div>;
}
