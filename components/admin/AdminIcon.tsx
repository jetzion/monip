import Image from "next/image";

import mark from "@/public/monip-mark.png";

/** MONIP "M" mark for the admin header and navigation. */
export function AdminIcon() {
  return <Image src={mark} alt="MONIP Group" className="monip-admin-icon" />;
}
