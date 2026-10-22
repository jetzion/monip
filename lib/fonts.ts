import { Archivo } from "next/font/google";

/** Site typeface (variable width axis used by `font-display`). */
export const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  axes: ["wdth"],
});
