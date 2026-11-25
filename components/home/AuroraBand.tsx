import { cn } from "cn";

import { auroraStyle, type SectionColors } from "@/lib/aurora";

type Props = {
  /** Shade of blue for the clouds (globals.css); the page's own blue when omitted. */
  shade?: "pale" | "sky";
  /** Editor's colours (Home page global); each one replaces part of the shade. */
  colors?: SectionColors | null;
  children: React.ReactNode;
};

/** Full-width homepage band with its own drifting aurora clouds, so sections alternate in colour. */
export function AuroraBand({ shade, colors, children }: Props) {
  return (
    <div className={cn("aurora-band", shade && `aurora-${shade}`)} style={auroraStyle(colors)}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">{children}</div>
    </div>
  );
}
