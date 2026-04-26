"use client";

import clsx from "clsx";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PriceChartProps {
  data: { time: string; price: number }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <p className="text-dim mb-0.5">{payload[0]?.payload?.time}</p>
      <p className="text-cyan font-600">
        ${payload[0]?.value?.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export default function PriceChart({ data }: PriceChartProps) {
  const prices = data.map((d) => d.price);
  const min = prices.length ? Math.min(...prices) : 67000;
  const max = prices.length ? Math.max(...prices) : 68000;
  const padding = (max - min) * 0.25 || 200;

  const first = prices[0];
  const last = prices[prices.length - 1];
  const change = first && last ? ((last - first) / first) * 100 : 0;
  const isUp = change >= 0;

  return (
    <div className="card-border rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-dim uppercase tracking-[0.12em]">Preço em tempo real</span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <span className={clsx("text-xs font-mono font-600", isUp ? "text-green" : "text-red")}>
            {isUp ? "▲ +" : "▼ "}{Math.abs(change).toFixed(2)}%
          </span>
          <span className="text-[10px] text-dim border border-border rounded px-2 py-0.5">
            {data.length} pts
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#18ffff" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#18ffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fill: "#5a6a84", fontSize: 9, fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[min - padding, max + padding]}
            tick={{ fill: "#5a6a84", fontSize: 9, fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#18ffff"
            strokeWidth={1.5}
            fill="url(#priceGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
