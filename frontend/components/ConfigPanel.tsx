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
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-dim text-xs flex-1">{label}</span>
      <div className="flex items-center gap-1">
        {options ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-muted border border-border rounded px-2 py-1 text-xs text-text font-mono focus:outline-none focus:border-blue"
          >
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-muted border border-border rounded px-2 py-1 text-xs text-text font-mono w-20 text-right focus:outline-none focus:border-blue"
          />
        )}
        {suffix && <span className="text-dim text-xs">{suffix}</span>}
      </div>
    </div>
  );
}

export default function ConfigPanel() {
  const [cfg, setCfg] = useState<Config>(defaultConfig);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof Config) => (val: string) => {
    setCfg((prev) => ({ ...prev, [key]: typeof prev[key] === "number" ? parseFloat(val) || 0 : val }));
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
    <div className="card-border rounded-lg p-4 flex flex-col gap-4">
      <span className="text-dim text-xs uppercase tracking-widest">Configuração</span>

      <div className="flex flex-col">
        <Field label="Par" value={cfg.symbol} onChange={update("symbol")} options={["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"]} />
        <Field label="Intervalo" value={cfg.interval} onChange={update("interval")} options={["1m", "3m", "5m", "15m"]} />
        <Field label="% por trade" value={cfg.trade_percent} onChange={update("trade_percent")} type="number" suffix="%" />
        <Field label="Stop-loss" value={cfg.stop_loss_pct} onChange={update("stop_loss_pct")} type="number" suffix="%" />
        <Field label="Take-profit" value={cfg.take_profit_pct} onChange={update("take_profit_pct")} type="number" suffix="%" />
        <Field label="RSI — oversold" value={cfg.rsi_oversold} onChange={update("rsi_oversold")} type="number" />
        <Field label="RSI — overbought" value={cfg.rsi_overbought} onChange={update("rsi_overbought")} type="number" />
      </div>

      <button
        onClick={handleSave}
        className={`w-full py-2 rounded text-xs font-mono font-600 tracking-widest uppercase transition-all duration-200 border ${
          saved
            ? "border-green/40 bg-green/10 text-green"
            : "border-blue/40 bg-blue/10 text-blue hover:bg-blue/20"
        }`}
      >
        {saved ? "✓ Guardado" : "Guardar configuração"}
      </button>
    </div>
  );
}
