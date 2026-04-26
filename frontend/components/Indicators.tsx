"use client";

import clsx from "clsx";

interface IndicatorsProps {
  rsi: number;
  emaFast: number;
  emaSlow: number;
  signal: "BUY" | "SELL" | "HOLD";
}

function RSIBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const zone = value < 35 ? "oversold" : value > 65 ? "overbought" : "neutral";
  const dotColor = zone === "oversold" ? "#00e676" : zone === "overbought" ? "#ff3d57" : "#448aff";
  const zoneLabel = zone === "oversold" ? "OVERSOLD" : zone === "overbought" ? "OVERBOUGHT" : "NEUTRAL";
  const zoneClass = zone === "oversold" ? "text-green" : zone === "overbought" ? "text-red" : "text-blue";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline text-xs">
        <span className="text-dim">RSI <span className="text-text font-600">({value.toFixed(1)})</span></span>
        <span className={clsx("text-[10px] font-600 tracking-wider", zoneClass)}>{zoneLabel}</span>
      </div>

      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "#111827" }}>
        {/* Zone background */}
        <div className="absolute inset-0 flex">
          <div className="w-[35%]" style={{ background: "rgba(0,230,118,0.06)" }} />
          <div className="w-[30%]" />
          <div className="w-[35%]" style={{ background: "rgba(255,61,87,0.06)" }} />
        </div>
        {/* Gradient track */}
        <div
          className="absolute top-0 left-0 h-full opacity-20 rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #00e676, #448aff, #ff3d57)",
          }}
        />
        {/* Zone lines */}
        <div className="absolute top-0 bottom-0 w-px" style={{ left: "35%", background: "rgba(0,230,118,0.3)" }} />
        <div className="absolute top-0 bottom-0 w-px" style={{ left: "65%", background: "rgba(255,61,87,0.3)" }} />
        {/* Dot indicator */}
        <div
          className="absolute rounded-full transition-all duration-500"
          style={{
            width: "7px",
            height: "7px",
            top: "50%",
            transform: "translateY(-50%)",
            left: `calc(${pct}% - 3.5px)`,
            backgroundColor: dotColor,
            boxShadow: `0 0 8px ${dotColor}`,
          }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-[#3a4a60] font-mono">
        <span>0</span>
        <span>35</span>
        <span>65</span>
        <span>100</span>
      </div>
    </div>
  );
}

const signalConfig = {
  BUY:  { label: "COMPRA",   color: "text-green", border: "border-green/25", bg: "bg-green/8",  icon: "▲" },
  SELL: { label: "VENDA",    color: "text-red",   border: "border-red/25",   bg: "bg-red/8",    icon: "▼" },
  HOLD: { label: "AGUARDAR", color: "text-blue",  border: "border-blue/25",  bg: "bg-blue/8",   icon: "◆" },
};

export default function Indicators({ rsi, emaFast, emaSlow, signal }: IndicatorsProps) {
  const cfg = signalConfig[signal];
  const emaCross = emaFast > emaSlow;
  const emaDiff = Math.abs(emaFast - emaSlow).toFixed(2);

  return (
    <div className="card-border rounded-lg p-4 flex flex-col gap-4">
      <span className="text-[10px] text-dim uppercase tracking-[0.12em]">Indicadores Técnicos</span>

      {/* Signal */}
      <div className={clsx("rounded-lg p-3 border flex items-center justify-between", cfg.border, cfg.bg)}>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-dim uppercase tracking-[0.12em]">Sinal atual</span>
          <span className={clsx("font-display font-700 text-xl tracking-wider", cfg.color)}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
        <div className={clsx("text-[10px] font-mono px-2 py-1 rounded border", cfg.border, cfg.color)}>
          {signal}
        </div>
      </div>

      {/* RSI */}
      <RSIBar value={rsi} />

      {/* EMA */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] text-dim uppercase tracking-[0.12em]">Médias Móveis</span>
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-dim">EMA 9</span>
            <span className="text-cyan font-mono font-600">
              ${emaFast.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">EMA 21</span>
            <span className="text-cyan font-mono font-600">
              ${emaSlow.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className={clsx(
          "text-[10px] px-2.5 py-1.5 rounded border text-center font-mono tracking-wide",
          emaCross
            ? "border-green/20 text-green bg-green/5"
            : "border-red/20 text-red bg-red/5"
        )}>
          {emaCross ? "▲ Golden Cross" : "▼ Death Cross"}
          <span className="text-[9px] ml-1.5 opacity-60">Δ${emaDiff}</span>
        </div>
      </div>
    </div>
  );
}
