import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-[#FF8000] text-white",
        secondary:   "border-[rgba(134,210,50,0.4)] bg-[rgba(134,210,50,0.1)] text-[#86D232]",
        destructive: "border-transparent bg-[rgba(255,75,75,0.15)] text-[#FF4B4B]",
        outline:     "border-[rgba(134,210,50,0.28)] text-[#C4C7C9]",
        success:     "border-transparent bg-[rgba(134,210,50,0.15)] text-[#86D232]",
        warning:     "border-transparent bg-[rgba(251,191,36,0.15)] text-amber-400",
        info:        "border-transparent bg-[rgba(96,165,250,0.15)] text-blue-400",
        muted:       "border-transparent bg-[#141414] text-[#C4C7C9]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
