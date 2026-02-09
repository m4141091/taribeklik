import React from "react";
import { cn } from "@/lib/utils";
import arrowIcon from "@/assets/button-arrow-icon.png";

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
  href?: string;
}

const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ className, children, href, onClick, ...props }, ref) => {
    const content = (
      <>
        <img src={arrowIcon} alt="" className="w-10 h-10 flex-shrink-0" />
        <span className="flex-1 text-center font-discovery-fs text-foreground text-lg pr-2">
          {children}
        </span>
      </>
    );

    const classes = cn(
      "inline-flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-[30px] pl-3 pr-1 py-1 hover:bg-background transition-colors cursor-pointer border border-border/50",
      className
    );

    if (href) {
      return (
        <a href={href} className={classes}>
          {content}
        </a>
      );
    }

    return (
      <button ref={ref} className={classes} onClick={onClick} {...props}>
        {content}
      </button>
    );
  }
);

BrandButton.displayName = "BrandButton";

export { BrandButton };
