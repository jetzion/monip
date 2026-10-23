import Image from "next/image";
import Link from "next/link";

import logo from "@/public/monip-logo.png";

/** MONIP Group logo linking to the homepage. `className` sets the height. */
export function SiteLogo({ className = "h-16" }: { className?: string }) {
  return (
    <Link href="/" className="inline-flex shrink-0">
      <Image src={logo} alt="MONIP Group home" className={`${className} w-auto`} loading="eager" />
    </Link>
  );
}
