"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const TESTIMONIALS = [
  {
    text: "Connecto has fundamentally transformed how we discover B2B partners. Highly recommended for any growing business!",
    name: "Lana Bernier",
    role: "Senior Paradigm Strategist",
    image: "https://plus.unsplash.com/premium_photo-1664476788423-7899ac87bd7f?w=600&auto=format&fit=crop&q=60"
  },
  {
    text: "This platform is a game changer! It allowed us to instantly connect with top-tier suppliers globally.",
    name: "James Holden",
    role: "CEO, TechNova",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=60"
  },
  {
    text: "The best professional community I've ever joined. The B2B marketplace is absolutely incredible for our sales.",
    name: "Sarah Chen",
    role: "Founder, GreenTech",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=60"
  },
  {
    text: "I was able to find investors for my startup within weeks. The networking capabilities are unmatched.",
    name: "David Kim",
    role: "Co-founder, AI Logic",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=60"
  },
  {
    text: "An indispensable tool for modern business development. It's like having a global trade show in your pocket.",
    name: "Elena Rodriguez",
    role: "VP of Sales, Global Logistics",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=60"
  }
];

export default function RightSection() {
  const [mounted, setMounted] = useState(false);
  const [testimonials, setTestimonials] = useState(TESTIMONIALS);

  useEffect(() => {
    setMounted(true);
    // Randomize testimonials on load
    const shuffled = [...TESTIMONIALS].sort(() => 0.5 - Math.random());
    setTestimonials(shuffled);
  }, []);

  return (
    <div className="sticky top-0 hidden h-full w-full p-4 lg:block">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[32px] p-8">
        <div className="absolute inset-0 bg-blue-600" />
        {/* Glow */}
        <div className="absolute left-[-100px] top-[-100px] h-[300px] w-[300px] rounded-full bg-blue-400/30 blur-3xl" />
        <div className="absolute right-[-100px] bottom-[-100px] h-[300px] w-[300px] rounded-full bg-blue-800/30 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-md">
          <span className="text-blue-600 font-bold text-5xl">C</span>
        </div>

        {/* Content */}
        <div className="relative z-10 mt-10">
          <h2 className="text-5xl font-extrabold tracking-tight text-white">
            Connecto
          </h2>

          <p className="mt-5 max-w-xl text-base leading-7 text-white/90">
            The professional community for businesses, investors, and professionals. Join today and start growing your network.
          </p>
        </div>

        {/* Bottom Cards */}
        <div className="relative z-10 mt-auto">
          {mounted && (
            <Carousel 
              className="w-full"
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                }),
              ]}
            >
              <CarouselContent>
                {testimonials.map((item, index) => (
                  <CarouselItem key={index} className="basis-[85%]">
                    <div className="rounded-3xl border border-white/30 bg-white/10 p-5 backdrop-blur-xl">
                      <p className="text-xs leading-5 text-white/90">
                        "{item.text}"
                      </p>

                      <div className="mt-5 flex items-center gap-3">
                        <div className="h-10 w-10 relative rounded-full overflow-hidden bg-white/20">
                          <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover"/>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white">
                            {item.name}
                          </h4>

                          <p className="text-xs text-white/60">
                            {item.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}

          <div className="mt-12 flex items-center justify-end gap-4">
            <div className="h-[2px] w-24 bg-white/70" />

            <p className="text-3xl font-light tracking-tight text-white/90">
              Build for connectivity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
