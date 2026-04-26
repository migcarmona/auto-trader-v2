"use client";

interface IndicatorsProps {
  rsi: number;
  emaFast: number;
  emaSlow: number;
  signal: "BUY" | "SELL" | "HOLD";
}

function RSIBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = value < 35 ? "#00e676" : value > 65 ? "#ff3d57" : "#448aff";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-dim">
        <span>RSI ({value.toFixed(1)})</span>
        <span>{value < 35 ? "OVERSOLD" : value > 65 ? "OVERBOUGHT" : "NEUTRAL"}</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        {/* Zonas */}
        <div className="absolute inset-0 flex">
          <div className="w-[35%] bg-green/10" />
          <div className="w-[30%]" />
          <div className="w-[35%] bg-red/10" />
        </div>
        {/* Linhas de referência */}
        <div className="absolute top-0 bottom-0 w-px bg-green/40" style={{ left: "35%" }} />
        <div className="absolute top-0 bottom-0 w-px bg-red/40" style={{ left: "65%" }} />
        {/* Barra */}
        <div
          className="absolute top-0 bottom-0 rounded-full transition-all duration-500"
          style={{ width: "6px", height: "6px", top: "50%", transform: "translateY(-50%)", left: `calc(${pct}% - 3px)`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>0</span>
        <span>35</span>
        <span>65</span>
        <span>100</span>
      </div>
    </div>
  );
}

const signalConfig = {
  BUY: { label: "COMPRA", color: "text-green", bg: "bg-green/10 border-green/30", glow: "glow-green" },
  SELL: { label: "VENDA", color: "text-red", bg: "bg-red/10 border-red/30", glow: "glow-red" },
  HOLD: { label: "AGUARDAR", color: "text-blue", bg: "bg-blue/10 border-blue/30", glow: "" },
};

export default function Indicators({ rsi, emaFast, emaSlow, signal }: IndicatorsProps) {
  const cfg = signalConfig[signal];
  const emaCross = emaFast > emaSlow;

  return (
    <div className="card-border rounded-lg p-4 flex flex-col gap-4">
      <span className="text-dim text-xs uppercase tracking-widest">Indicadores Técnicos</span>

      {/* Sinal atual */}
      <div className={`border rounded-lg p-3 flex items-center justify-between ${cfg.bg} ${cfg.glow}`}>
        <span className="text-dim text-xs">Sinal atual</span>
        <span className={`font-display font-700 text-lg tracking-wider ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* RSI */}
      <RSIBar value={rsi} />

      {/* EMA */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs">
          <span className="text-dim">EMA 9 (rápida)</span>
          <span className="text-cyan font-mono">${emaFast.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-dim">EMA 21 (lenta)</span>
          <span className="text-cyan font-mono">${emaSlow.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className={`text-xs px-2 py-1 rounded border text-center ${emaCross ? "border-green/20 text-green bg-green/5" : "border-red/20 text-red bg-red/5"}`}>
          {emaCross ? "▲ Golden Cross (EMA9 > EMA21)" : "▼ Death Cross (EMA9 < EMA21)"}
        </div>
      </div>
    </div>
  );
}
