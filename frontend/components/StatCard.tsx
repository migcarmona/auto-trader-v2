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

const accentClasses = {
  green: "text-green text-glow-green",
  red: "text-red text-glow-red",
  blue: "text-blue",
  yellow: "text-yellow",
  cyan: "text-cyan",
  default: "text-text",
};

export default function StatCard({ label, value, sub, accent = "default", large, prefix }: StatCardProps) {
  return (
    <div className="card-border rounded-lg p-4 flex flex-col gap-1 animate-fade-in">
      <span className="text-dim text-xs uppercase tracking-widest font-mono">{label}</span>
      <div className="flex items-baseline gap-1">
        {prefix && <span className="text-dim text-sm">{prefix}</span>}
        <span className={clsx(
          "font-display font-700 leading-none",
          large ? "text-3xl" : "text-xl",
          accentClasses[accent]
        )}>
          {value}
        </span>
      </div>
      {sub && <span className="text-dim text-xs">{sub}</span>}
    </div>
  );
}
