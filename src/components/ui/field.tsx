import { cn } from "@/lib/utils";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export const fieldClassName =
  "w-full rounded-[3px] bg-base border border-border text-sm text-foreground placeholder:text-dim " +
  "transition focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const labelClassName =
  "block text-[11px] font-medium uppercase tracking-[0.08em] text-muted mb-2";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input ref={ref} className={cn(fieldClassName, "px-3.5 py-2.5", className)} {...props} />
    );
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldClassName, "px-3.5 py-2.5 resize-none", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(fieldClassName, "px-3.5 py-2.5 cursor-pointer", className)}
      {...props}
    >
      {children}
    </select>
  );
});

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className={labelClassName}>
          {label}
          {required && <span className="text-accent-hover ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[11px] text-error-text">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-dim">{hint}</p>
      ) : null}
    </div>
  );
}
