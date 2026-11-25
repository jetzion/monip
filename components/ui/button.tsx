import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * The site's button standard (REQUIREMENTS.md, "Buttons"). `primary` is the one gold call to action per
 * screen area; `secondary` is the outlined alternative, `secondary-inverse` the same on navy bands.
 * Size and colour come only from these variants: pages pass layout classes, never their own.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border-[1.5px] font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:active:not-disabled:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-wait [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-gold text-navy shadow-sm focus-visible:ring-azure not-disabled:hover:bg-gold-hover not-disabled:hover:shadow-md active:not-disabled:bg-gold-active",
        secondary:
          "border-navy/40 bg-transparent text-navy focus-visible:ring-azure not-disabled:hover:border-navy not-disabled:hover:bg-tint active:not-disabled:bg-accent",
        "secondary-inverse":
          "border-white/50 bg-transparent text-white focus-visible:ring-white focus-visible:ring-offset-navy not-disabled:hover:border-white not-disabled:hover:bg-white/15 active:not-disabled:bg-white/25",
      },
      size: {
        md: "h-11 px-6 text-[0.9375rem]",
        sm: "h-9 px-4 text-sm",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
