import { clsx } from "clsx";
import type { ApplicationStatus } from "@/types";

type BadgeVariant = ApplicationStatus | "neutral";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  applied:      "bg-primary-50 text-primary-600",
  interviewing: "bg-amber-50 text-amber-700",
  offer:        "bg-emerald-50 text-emerald-700",
  rejected:     "bg-rose-50 text-rose-600",
  withdrawn:    "bg-slate-100 text-slate-500",
  neutral:      "bg-slate-100 text-slate-600",
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ label, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
