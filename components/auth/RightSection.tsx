import React from "react";
import Image from "next/image";
import { Carousel,CarouselContent,CarouselItem } from "../ui/carousel";
export default function RightSection() {
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
          <Carousel className="w-full">
            <CarouselContent>
              {[1, 2, 3].map((item) => (
                <CarouselItem key={item} className="basis-[85%]">
                  <div className="rounded-3xl border border-white/30 bg-white/10 p-5 backdrop-blur-xl">
                    <p className="text-xs leading-5 text-white/90">
                      "Connecto has fundamentally transformed how we discover B2B partners. Highly recommended for any growing business!"
                    </p>

                    <div className="mt-5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full relative rounded-full overflow-hidden">
                        <Image src={"https://plus.unsplash.com/premium_photo-1664476788423-7899ac87bd7f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bWFsZXxlbnwwfHwwfHx8MA%3D%3D"} alt="Loading..." fill className="object-cover"/>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Lana Bernier
                        </h4>

                        <p className="text-xs text-white/60">
                          Senior Paradigm Strategist
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

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
