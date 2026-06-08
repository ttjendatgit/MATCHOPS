import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030303] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#FF8000] text-white shadow-sm hover:bg-[#FF8000]/85 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,128,0,0.4)] active:scale-[0.98] active:translate-y-0",
        destructive:
          "bg-[rgba(255,75,75,0.15)] text-[#FF4B4B] border border-[rgba(255,75,75,0.3)] hover:bg-[rgba(255,75,75,0.25)] active:scale-[0.98]",
        outline:
          "border border-[rgba(134,210,50,0.4)] bg-transparent text-[#86D232] hover:bg-[rgba(134,210,50,0.08)] hover:border-[rgba(134,210,50,0.65)] hover:shadow-[0_0_12px_rgba(134,210,50,0.2)] active:scale-[0.98]",
        secondary:
          "bg-[rgba(134,210,50,0.12)] text-[#86D232] border border-[rgba(134,210,50,0.3)] hover:bg-[rgba(134,210,50,0.2)] active:scale-[0.98]",
        ghost:
          "text-[#C4C7C9] hover:bg-[#141414] hover:text-white active:scale-[0.98]",
        link:
          "text-[#FF8000] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-11 rounded-lg px-8 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        suppressHydrationWarning
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
