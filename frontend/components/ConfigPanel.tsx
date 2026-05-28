"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";

interface Config {
  symbol: string;
  interval: string;
  trade_percent: number;
  stop_loss_pct: number;
  take_profit_pct: number;
  rsi_oversold: number;
  rsi_overbought: number;
  trading_mode: "paper" | "live";
}

// FIX: valores alinhados com config.py corrigido
export default function ConfigPanel({ status }: { status?: BotStatus }) {
  symbol:          "XBTUSDT",  // FIX: era "BTCUSDT"
  interval:        "5",        // FIX: era "1m"
  trade_percent:   10,
  stop_loss_pct:   1.0,        // FIX: era 0.5 (menor que as fees!)
  take_profit_pct: 2.0,        // FIX: era 1.0
  rsi_oversold:    35,
  rsi_overbought:  65,
  trading_mode:    "paper",
};

// FIX: símbolos e intervalos no formato correto da Kraken
const SYMBOLS   = ["XBTUSDT", "XETHUSDT", "SOLUSDT"];
const INTERVALS = ["5", "15", "30", "60"];  // FIX: removidos 1m e 3m

const INTERVAL_LABELS: Record<string, string> = {
  "5":  "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
};

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  suffix?: string;
  options?: string[];
  optionLabels?: Record<string, string>;
  min?: number;
  step?: number;
}

function Field({ label, value, onChange, type = "text", suffix, options, optionLabels, min, step }: FieldProps) {
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
            {options.map((o) => (
              <option key={o} value={o}>
                {optionLabels?.[o] ?? o}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            min={min}
            step={step}
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
  const { status } = useBotData(0); // FIX: lê status atual para inicializar o painel
  const [cfg, setCfg]               = useState<Config>(defaultConfig);
  const [saved, setSaved]           = useState(false);
  const [liveWarning, setLiveWarning] = useState(false);

  // FIX: sincroniza painel com valores reais do bot ao montar
  useEffect(() => {
    if (status?.symbol) {
      setCfg((prev) => ({
        ...prev,
        symbol:          status.symbol        ?? prev.symbol,
        interval:        status.interval      ?? prev.interval,
        trading_mode:    status.trading_mode  ?? prev.trading_mode,
      }));
    }
  }, [status?.symbol]);

  const update = (key: keyof Config) => (val: string) => {
    if (key === "trading_mode" && val === "live") {
      setLiveWarning(true);
      return;
    }
    setCfg((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "number" ? parseFloat(val) || 0 : val,
    }));
    setSaved(false);
  };

  const confirmLive = () => {
    setCfg((prev) => ({ ...prev, trading_mode: "live" }));
    setLiveWarning(false);
    setSaved(false);
  };

  // FIX: validação antes de guardar
  const validate = (): string | null => {
    if (cfg.stop_loss_pct < 0.8)
      return "Stop-loss mínimo de 0.8% (fees Kraken = 0.52%)";
    if (cfg.take_profit_pct <= cfg.stop_loss_pct)
      return "Take-profit deve ser maior que o stop-loss";
    if (cfg.trade_percent < 1 || cfg.trade_percent > 50)
      return "% por trade deve estar entre 1% e 50%";
    return null;
  };

  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);

    try {
      await fetch("/api/bot/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Erro ao guardar — backend offline");
    }
  };

  return (
    <div className="card-border rounded-lg p-4 flex flex-col gap-3">
      <span className="text-[10px] text-dim uppercase tracking-[0.12em]">Configuração</span>

      {/* Trading Mode Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-border">
        <button
          onClick={() => update("trading_mode")("paper")}
          className={clsx(
            "flex-1 py-2 text-[11px] font-mono font-600 tracking-wider uppercase transition-all duration-200",
            cfg.trading_mode === "paper" ? "bg-blue/15 text-blue" : "text-dim hover:text-text"
          )}
        >
          Paper
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={() => update("trading_mode")("live")}
          className={clsx(
            "flex-1 py-2 text-[11px] font-mono font-600 tracking-wider uppercase transition-all duration-200",
            cfg.trading_mode === "live" ? "bg-red/15 text-red" : "text-dim hover:text-text"
          )}
        >
          ⚠ Live
        </button>
      </div>

      {/* Live warning */}
      {liveWarning && (
        <div className="border border-red/30 bg-red/5 rounded-lg p-3 flex flex-col gap-2">
          <span className="text-red text-[11px] font-600">Atenção — Dinheiro Real</span>
          <span className="text-dim text-[10px] leading-relaxed">
            Em modo Live, o bot executa ordens reais na Kraken com o teu dinheiro.
            Certifica-te que tens KRAKEN_API_KEY e KRAKEN_API_SECRET definidas no Railway.
          </span>
          <div className="flex gap-2 mt-1">
            <button
              onClick={confirmLive}
              className="flex-1 py-1.5 rounded border border-red/40 bg-red/10 text-red text-[10px] font-600 uppercase tracking-wider hover:bg-red/20 transition-all"
            >
              Confirmar
            </button>
            <button
              onClick={() => setLiveWarning(false)}
              className="flex-1 py-1.5 rounded border border-border text-dim text-[10px] uppercase tracking-wider hover:text-text transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col">
        <SectionLabel>Par / Intervalo</SectionLabel>
        <Field
          label="Par"
          value={cfg.symbol}
          onChange={update("symbol")}
          options={SYMBOLS}
        />
        <Field
          label="Intervalo"
          value={cfg.interval}
          onChange={update("interval")}
          options={INTERVALS}
          optionLabels={INTERVAL_LABELS}  // FIX: mostra "5m" mas envia "5"
        />

        <SectionLabel>Gestão de risco</SectionLabel>
        <Field label="% por trade"  value={cfg.trade_percent}   onChange={update("trade_percent")}   type="number" suffix="%" min={1}   step={1} />
        <Field label="Stop-loss"    value={cfg.stop_loss_pct}   onChange={update("stop_loss_pct")}   type="number" suffix="%" min={0.8} step={0.1} />
        <Field label="Take-profit"  value={cfg.take_profit_pct} onChange={update("take_profit_pct")} type="number" suffix="%" min={0.8} step={0.1} />

        <SectionLabel>RSI</SectionLabel>
        <Field label="Oversold"     value={cfg.rsi_oversold}    onChange={update("rsi_oversold")}    type="number" min={10} step={1} />
        <Field label="Overbought"   value={cfg.rsi_overbought}  onChange={update("rsi_overbought")}  type="number" min={10} step={1} />
      </div>

      {/* FIX: erro de validação visível */}
      {error && (
        <div className="text-red text-[10px] font-mono border border-red/20 bg-red/5 rounded px-3 py-2">
          ⚠ {error}
        </div>
      )}

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