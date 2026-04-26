"use client";

import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "red" | "blue" | "yellow" | "cyan" | "default";
  large?: boolean;
  prefix?: string;
}

const accentValue: Record<string, string> = {
  green:   "text-green text-glow-green",
  red:     "text-red text-glow-red",
  blue:    "text-blue text-glow-blue",
  yellow:  "text-yellow text-glow-yellow",
  cyan:    "text-cyan text-glow-cyan",
  default: "text-text",
};

const accentBorder: Record<string, string> = {
  green:   "border-l-green/50",
  red:     "border-l-red/50",
  blue:    "border-l-blue/50",
  yellow:  "border-l-yellow/50",
  cyan:    "border-l-cyan/50",
  default: "border-l-border",
};

export default function StatCard({ label, value, sub, accent = "default", large, prefix }: StatCardProps) {
  return (
    <div className={clsx(
      "card-border rounded-lg p-4 flex flex-col gap-1.5 animate-fade-in",
      "border-l-2", accentBorder[accent]
    )}>
      <span className="text-[10px] text-dim uppercase tracking-[0.12em] font-mono">{label}</span>
      <div className="flex items-baseline gap-1">
        {prefix && <span className="text-dim text-sm">{prefix}</span>}
        <span className={clsx(
          "font-display leading-none",
          large ? "text-3xl font-800" : "text-xl font-700",
          accentValue[accent]
        )}>
          {value}
        </span>
      </div>
      {sub && <span className="text-[10px] text-[#3d5070] font-mono leading-snug">{sub}</span>}
    </div>
  );
}
