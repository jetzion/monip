import Image from "next/image";

import logo from "@/public/monip-logo.png";

/** Full MONIP logo for the admin login, forgot-password, and first-user pages. */
export function AdminLogo() {
  return <Image src={logo} alt="MONIP Group" className="monip-admin-logo" priority />;
}
