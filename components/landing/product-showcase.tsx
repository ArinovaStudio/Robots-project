"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  Check,
  Compass,
  Heart,
  Home,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Users,
} from "lucide-react";
import { Button } from "./landing-button";

const appIcon = "/landing/app-icon.png";
const founder = "/landing/founder.jpg";

export type DemoView = "feed" | "discover" | "messages";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <a href="#" className={`brand ${light ? "brand-light" : ""}`} aria-label="Connecto home">
      <span className="brand-mark">✳</span>connecto<span className="text-primary">.</span>
    </a>
  );
}

export const businesses = [
  {
    name: "Orbit Studio",
    type: "Brand & digital design",
    mark: "o",
    style: "ink",
    location: "London, UK",
  },
  {
    name: "Forma Labs",
    type: "Product development",
    mark: "f",
    style: "",
    location: "Bengaluru, India",
  },
  {
    name: "Bloom Social",
    type: "Marketing & storytelling",
    mark: "b",
    style: "mint",
    location: "Amsterdam, NL",
  },
  {
    name: "Layers",
    type: "Creative development",
    mark: "L",
    style: "ink",
    location: "New York, US",
  },
] as const;

export function BizLogo({ mark, style = "" }: { mark: string; style?: string }) {
  return <div className={`biz-logo ${style}`}>{mark}</div>;
}

export function ProductShowcase({
  view = "feed",
  compact = false,
}: {
  view?: DemoView;
  compact?: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [connected, setConnected] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [localView, setLocalView] = useState<DemoView | null>(null);
  const activeView = localView ?? view;

  return (
    <div className="product" aria-label="Interactive Connecto product preview">
      <div className="product-top">
        <Brand />
        <div className="product-top-right">
          <Search />
          <Mail />
          <Bell />
          <img
            className="mini-avatar"
            src={founder}
            alt="Business owner profile"
            width={25}
            height={25}
            loading="lazy"
          />
        </div>
      </div>
      <div className="product-layout">
        <aside className="product-sidebar">
          <div className="business-id">
            <BizLogo mark="a" />
            <div>
              <b>Acme Studio</b>
              <small>Your business workspace</small>
            </div>
          </div>
          <Button
            variant="ghost"
            className={`side-item w-full justify-start ${activeView === "feed" ? "active" : ""}`}
            onClick={() => setLocalView("feed")}
          >
            <Home /> Your feed
          </Button>
          <Button
            variant="ghost"
            className={`side-item w-full justify-start ${activeView === "discover" ? "active" : ""}`}
            onClick={() => setLocalView("discover")}
          >
            <Compass /> Discover
          </Button>
          <div className="side-item">
            <Users /> My network
          </div>
          <Button
            variant="ghost"
            className={`side-item w-full justify-start ${activeView === "messages" ? "active" : ""}`}
            onClick={() => setLocalView("messages")}
          >
            <MessageCircle /> Messages
          </Button>
          <Button
            variant="ghost"
            className={`side-item w-full justify-start ${saved ? "active" : ""}`}
            onClick={() => setSaved(!saved)}
          >
            <Bookmark /> {saved ? "Post saved" : "Saved posts"}
          </Button>
        </aside>
        <main className="product-feed">
          <div className="feed-heading">
            <h4>
              {activeView === "feed"
                ? "Your daily spark"
                : activeView === "discover"
                  ? "Find your people"
                  : "Good things start here"}
            </h4>
            <small>{activeView === "feed" ? "For you · Following" : "Your business network"}</small>
          </div>
          {activeView === "feed" ? (
            <article className="post">
              <div className="post-author">
                <BizLogo mark="o" style="ink" />
                <div>
                  <b>
                    Orbit Studio <span className="text-primary">✓</span>
                  </b>
                  <small>Brand & digital design · 2h ago</small>
                </div>
                <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
              </div>
              <p>
                Big ideas. A bold new identity. ✨<br />A little look at what we've been building
                for our friends at Forma.
              </p>
              <div className="post-art">
                <div>
                  <strong>
                    Good things
                    <br />
                    take shape.
                  </strong>
                  <small>ORBIT STUDIO × FORMA LABS</small>
                </div>
                <img
                  src={appIcon}
                  alt="Blue sculptural brand artwork"
                  width={130}
                  height={130}
                  loading="lazy"
                />
              </div>
              <div className="post-actions">
                <Button
                  aria-label={liked ? "Unlike post" : "Like post"}
                  variant="ghost"
                  onClick={() => setLiked(!liked)}
                  className={liked ? "text-primary" : ""}
                >
                  <Heart fill={liked ? "currentColor" : "none"} /> {liked ? "129" : "128"}
                </Button>
                <span className="flex items-center gap-1">
                  <MessageCircle /> 24 comments
                </span>
                <Button
                  variant="ghost"
                  onClick={() => setSaved(!saved)}
                  aria-label={saved ? "Unsave post" : "Save post"}
                  className="ml-auto"
                >
                  <Bookmark fill={saved ? "currentColor" : "none"} />
                  {saved ? "Saved" : "Save"}
                </Button>
              </div>
            </article>
          ) : activeView === "discover" ? (
            <div className="demo-directory">
              {businesses.slice(0, compact ? 2 : 4).map((b) => (
                <article className="directory-profile" key={b.name}>
                  <BizLogo mark={b.mark} style={b.style} />
                  <h4>{b.name}</h4>
                  <p>{b.type}</p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setConnected((prev) =>
                        prev.includes(b.name)
                          ? prev.filter((n) => n !== b.name)
                          : [...prev, b.name]
                      )
                    }
                  >
                    {connected.includes(b.name) ? <Check /> : <Plus />}
                    {connected.includes(b.name) ? "Connected" : "Connect"}
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <>
              <div className="mini-message">
                <b>
                  Orbit Studio <span className="text-primary">✓</span>
                </b>
                Hey Acme! Loved your latest launch. We’re looking for a product partner for
                something exciting. Up for a chat?
                <small className="block mt-2 text-muted-foreground">Today, 10:24 AM</small>
              </div>
              <div className="mini-message bg-secondary">
                <b>You</b>Absolutely. Great work happens together. Let’s connect!
                <Send className="ml-auto mt-2 size-3 text-primary" />
              </div>
            </>
          )}
        </main>
        <aside className="product-recommendations">
          <h4>People? No. Possibilities.</h4>
          {businesses.slice(0, 3).map((b) => (
            <div className="recommendation" key={b.name}>
              <BizLogo mark={b.mark} style={b.style} />
              <div>
                <b>{b.name}</b>
                <small>{b.type}</small>
              </div>
              <Button
                variant="ghost"
                aria-label={`Connect with ${b.name}`}
                onClick={() =>
                  setConnected((prev) =>
                    prev.includes(b.name) ? prev.filter((n) => n !== b.name) : [...prev, b.name]
                  )
                }
              >
                {connected.includes(b.name) ? <Check /> : <Plus />}
              </Button>
            </div>
          ))}
          <div className="topics">
            <b className="text-foreground">What’s making waves</b>
            <br />
            #BuildInPublic
            <br />
            #StartupStories
            <br />
            #BetterTogether
            <br />
            <span className="text-primary flex items-center gap-1 mt-3">
              Explore the community <ArrowUpRight className="size-3" />
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
