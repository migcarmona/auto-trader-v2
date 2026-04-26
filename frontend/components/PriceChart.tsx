"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PriceChartProps {
  data: { time: string; price: number }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface border border-border rounded px-3 py-2 text-xs font-mono">
        <p className="text-dim">{payload[0]?.payload?.time}</p>
        <p className="text-cyan">${payload[0]?.value?.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</p>
      </div>
    );
  }
  return null;
};

export default function PriceChart({ data }: PriceChartProps) {
  const min = Math.min(...data.map((d) => d.price));
  const max = Math.max(...data.map((d) => d.price));
  const padding = (max - min) * 0.2;

  return (
    <div className="card-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-dim text-xs uppercase tracking-widest">Preço em tempo real</span>
        <span className="text-dim text-xs">{data.length} pontos</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#18ffff" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#18ffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fill: "#5a6a84", fontSize: 10, fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[min - padding, max + padding]}
            tick={{ fill: "#5a6a84", fontSize: 10, fontFamily: "IBM Plex Mono" }}
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
