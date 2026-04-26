"use client";

import { useState } from "react";

interface Config {
  symbol: string;
  interval: string;
  trade_percent: number;
  stop_loss_pct: number;
  take_profit_pct: number;
  rsi_oversold: number;
  rsi_overbought: number;
}

const defaultConfig: Config = {
  symbol: "BTCUSDT",
  interval: "1m",
  trade_percent: 10,
  stop_loss_pct: 0.5,
  take_profit_pct: 1.0,
  rsi_oversold: 35,
  rsi_overbought: 65,
};

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  suffix?: string;
  options?: string[];
}

function Field({ label, value, onChange, type = "text", suffix, options }: FieldProps) {
  const inputClass =
    "bg-[#0d1117] border border-border rounded px-2.5 py-1.5 text-[11px] text-text font-mono " +
    "focus:outline-none focus:border-blue/60 focus:ring-1 focus:ring-blue/20 transition-all duration-150";

  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-[11px] text-dim flex-1 leading-none">{label}</span>
      <div className="flex items-center gap-1.5">
        {options ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass + " cursor-pointer"}
          >
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass + " w-20 text-right"}
          />
        )}
        {suffix && <span className="text-[11px] text-dim w-4">{suffix}</span>}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-1 pb-0.5">
      <span className="text-[9px] text-[#2a3448] uppercase tracking-[0.15em] font-mono">{children}</span>
    </div>
  );
}

export default function ConfigPanel() {
  const [cfg, setCfg] = useState<Config>(defaultConfig);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof Config) => (val: string) => {
    setCfg((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "number" ? parseFloat(val) || 0 : val,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await fetch("/api/bot/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
    } catch { /* offline */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card-border rounded-lg p-4 flex flex-col gap-3">
      <span className="text-[10px] text-dim uppercase tracking-[0.12em]">Configuração</span>

      <div className="flex flex-col">
        <SectionLabel>Par / Intervalo</SectionLabel>
        <Field label="Par" value={cfg.symbol} onChange={update("symbol")} options={["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"]} />
        <Field label="Intervalo" value={cfg.interval} onChange={update("interval")} options={["1m", "3m", "5m", "15m"]} />

        <SectionLabel>Gestão de risco</SectionLabel>
        <Field label="% por trade" value={cfg.trade_percent} onChange={update("trade_percent")} type="number" suffix="%" />
        <Field label="Stop-loss" value={cfg.stop_loss_pct} onChange={update("stop_loss_pct")} type="number" suffix="%" />
        <Field label="Take-profit" value={cfg.take_profit_pct} onChange={update("take_profit_pct")} type="number" suffix="%" />

        <SectionLabel>RSI</SectionLabel>
        <Field label="Oversold" value={cfg.rsi_oversold} onChange={update("rsi_oversold")} type="number" />
        <Field label="Overbought" value={cfg.rsi_overbought} onChange={update("rsi_overbought")} type="number" />
      </div>

      <button
        onClick={handleSave}
        className={[
          "w-full py-2 rounded text-[11px] font-mono font-600 tracking-widest uppercase transition-all duration-200 border",
          saved
            ? "border-green/40 bg-green/10 text-green"
            : "border-blue/30 bg-blue/5 text-blue hover:bg-blue/15 hover:border-blue/50",
        ].join(" ")}
      >
        {saved ? "✓ Guardado" : "Guardar configuração"}
      </button>
    </div>
  );
}
