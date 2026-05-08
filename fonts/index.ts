import { Bricolage_Grotesque } from "next/font/google";
import localFont from "next/font/local";

export const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700", "800"],
});


export const sfPro = localFont({
  src: [
    {
      path: "./locals/sf-pro-display/SFPRODISPLAYREGULAR.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./locals/sf-pro-display/SFPRODISPLAYMEDIUM.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./locals/sf-pro-display/SFPRODISPLAYMEDIUM.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./locals/sf-pro-display/SFPRODISPLAYBOLD.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-sf-pro",
});