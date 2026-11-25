import { cn } from "cn";

type Props = {
  /** Shade of blue for the clouds (globals.css); the page's own blue when omitted. */
  shade?: "pale" | "sky";
  children: React.ReactNode;
};

/** Full-width homepage band with its own drifting aurora clouds, so sections alternate in colour. */
export function AuroraBand({ shade, children }: Props) {
  return (
    <div className={cn("aurora-band", shade && `aurora-${shade}`)}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">{children}</div>
    </div>
  );
}
