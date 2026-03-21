import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-button text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary disabled:opacity-50 disabled:pointer-events-none ring-offset-bg-base",
  {
    variants: {
      variant: {
        default: "bg-text-primary text-bg-base hover:bg-text-primary/90",
        destructive: "bg-status-rejected-bg text-status-rejected-text hover:bg-status-rejected-bg/90",
        outline: "border border-border-strong hover:bg-bg-hover hover:text-text-primary",
        secondary: "bg-bg-raised text-text-primary hover:bg-bg-hover",
        ghost: "hover:bg-bg-hover hover:text-text-primary",
        link: "underline-offset-4 hover:underline text-text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
