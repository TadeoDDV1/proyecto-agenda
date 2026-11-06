import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg border border-accent font-semibold hover:bg-accent-hover hover:border-accent-hover active:translate-y-px",
  secondary:
    "bg-surface-raised text-foreground border border-border hover:border-border-strong hover:bg-surface-overlay active:translate-y-px",
  ghost:
    "bg-transparent text-muted border border-transparent hover:text-foreground hover:bg-surface-raised",
  danger:
    "bg-error/10 text-error-text border border-error/30 hover:bg-error/20",
  success:
    "bg-success/10 text-success-text border border-success/30 hover:bg-success/20",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-[2px]",
  md: "h-10 px-4 text-sm gap-2 rounded-[3px]",
  lg: "h-12 px-6 text-sm gap-2.5 rounded-[3px] font-medium",
  icon: "h-9 w-9 rounded-[3px]",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center font-medium transition select-none",
    variantStyles[variant],
    sizeStyles[size],
    className
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        buttonClasses(variant, size),
        "disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none",
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
