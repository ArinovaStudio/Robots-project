import React from "react";
import Image from "next/image";
import { Carousel,CarouselContent,CarouselItem } from "../ui/carousel";
export default function RightSection() {
  return (
    <div className="sticky top-0 hidden h-full max-h-[700px] p-4 lg:block">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[32px] p-8">
        <Image alt={"Loading..."} fill src="/bg-gradient.png" />
        {/* Glow */}
        <div className="absolute left-[-100px] top-[-100px] h-[300px] w-[300px] rounded-full bg-white/30 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-sm bg-white shadow-md">
          <span className="font-bold text-black">LOGO</span>
        </div>

        {/* Content */}
        <div className="relative z-10 mt-10">
          <h2 className="text-6xl font-extrabold tracking-tight text-white">
            Mr.Robot
          </h2>

          <p className="mt-5 max-w-xl text-base leading-7 text-white/80">
            Lorem ipsum dolor sit amet consectetur. Suscipit sed amet commodo
            vel ultrices tortor orci. Enim lectus turpis augue donec. Gravida
            non
          </p>
        </div>

        {/* Bottom Cards */}
        <div className="relative z-10 mt-auto">
          <Carousel className="w-full">
            <CarouselContent>
              {[1, 2, 3].map((item) => (
                <CarouselItem key={item} className="basis-[85%]">
                  <div className="rounded-3xl border border-white/30 bg-white/10 p-5 backdrop-blur-xl">
                    <p className="text-xs leading-5 text-white/80">
                      Dude, your stuff is the bomb! House rent is the real deal!
                      I STRONGLY recommend house rent to EVERYONE interested in
                      running a successful online business!
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
