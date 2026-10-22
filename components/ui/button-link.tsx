import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import Link from "next/link";

import { buttonVariants } from "./button";

type Props = React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

/** A navigation link styled as a button. */
export function ButtonLink({ className, variant, size, ...props }: Props) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
