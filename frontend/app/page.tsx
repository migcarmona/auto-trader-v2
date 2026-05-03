"use client";

import { useBotData } from "@/hooks/useBotData";
import StatCard from "@/components/StatCard";
import PriceChart from "@/components/PriceChart";
import TradeHistory from "@/components/TradeHistory";
import Indicators from "@/components/Indicators";
import ConfigPanel from "@/components/ConfigPanel";
import WalletButton from "@/components/WalletButton";
import clsx from "clsx";

export default function Dashboard() {
  const { status, connected, priceHistory, startBot, stopBot } = useBotData(5000);

  const winRate =
    status.wins + status.losses > 0
      ? ((status.wins / (status.wins + status.losses)) * 100).toFixed(1)
      : "—";

  const pnlColor = status.total_return_pct >= 0 ? "green" : "red";

  const first = priceHistory[0]?.price;
  const last = priceHistory[priceHistory.length - 1]?.price;
  const priceChangePct = first && last ? ((last - first) / first) * 100 : 0;
  const isUp = priceChangePct >= 0;

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ─────────────────────────────── */}
      <header
        className="border-b border-border/60 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10"
        style={{ background: "rgba(9,11,15,0.92)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-cyan/20 bg-cyan/5 flex items-center justify-center text-cyan text-base select-none">
            <img src="/favicon.ico" alt="Logo" className="w-6 h-6" />
          </div>
          <div className="leading-none">
            <div className="font-display font-700 text-sm tracking-widest uppercase text-text">AstraX</div>
            <div className="text-[10px] text-dim tracking-wide mt-0.5">Scalping Engine</div>
          </div>
          <div className="ml-4 flex items-baseline gap-2 text-center">
            <span
            className="font-display font-800 text-4xl text-cyan text-glow-cyan cursor-default"
            suppressHydrationWarning
          >
            Auto Trader
          </span>
          <span
            className={clsx("text-sm font-mono font-600", isUp ? "text-green" : "text-red")}
            suppressHydrationWarning
          >
           v2
          </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {connected && (
            <span className={clsx(
              "text-[10px] font-mono font-600 px-2 py-0.5 rounded border tracking-wider uppercase",
              status.trading_mode === "live"
                ? "border-red/40 bg-red/10 text-red"
                : "border-blue/30 bg-blue/5 text-blue"
            )}>
              {status.trading_mode === "live" ? "⚠ LIVE" : "PAPER"}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs">
            <div className={clsx(
              "w-1.5 h-1.5 rounded-full",
              connected ? "bg-green animate-pulse" : "bg-red"
            )} />
            <span className={clsx("text-[11px] font-mono", connected ? "text-dim" : "text-red/70")}>
              {connected ? "LIGADO" : "MODO DEMO"}
            </span>
          </div>
          <button
            onClick={status.running ? stopBot : startBot}
            className={clsx(
              "px-4 py-1.5 rounded text-[11px] font-mono font-600 tracking-widest uppercase border transition-all duration-200",
              status.running
                ? "border-red/40 bg-red/10 text-red hover:bg-red/20 hover:border-red/60"
                : "border-green/40 bg-green/10 text-green hover:bg-green/20 hover:border-green/60"
            )}
          >
            {status.running ? "■ PARAR" : "▶ INICIAR"}
          </button>
        </div>
      </header>

      {/* ── Price banner ───────────────────────── */}
      <div className="border-b border-border/40 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(13,17,23,0.6)" }}>
        <div className="flex items-baseline gap-3">
          <span
            className="font-display font-800 text-4xl text-cyan text-glow-cyan cursor-default"
            suppressHydrationWarning
          >
            Auto Trader
          </span>
          <span
            className={clsx("text-sm font-mono font-600", isUp ? "text-green" : "text-red")}
            suppressHydrationWarning
          >
           v2
          </span>
          <WalletButton />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-dim">{status.symbol}</span>
            <span className="text-[10px] text-dim px-1.5 py-0.5 bg-surface border border-border rounded">
              {status.interval}
            </span>
          <div className="text-dim text-xs font-mono border-l border-border pl-4" suppressHydrationWarning>
            {new Date(status.last_updated).toLocaleTimeString("pt-PT")}
          </div>
          <div className="flex items-center gap-1.5 border-l border-border pl-4">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
            <span className="text-[10px] text-dim font-mono tracking-[0.15em]">LIVE</span>
          </div>
        </div>
      </div>

      {/* ── Main ───────────────────────────────── */}
      <main className="flex-1 p-6 flex flex-col gap-5 max-w-7xl mx-auto w-full">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Saldo USDT"
            value={`$${status.balance.toFixed(2)}`}
            sub={`Inicial: $${status.initial_balance.toFixed(2)}`}
            accent="default"
          />
          <StatCard
            label="Valor Total"
            value={`$${status.total_value.toFixed(2)}`}
            sub={status.crypto_held > 0 ? `+${status.crypto_held.toFixed(6)} BTC` : "Sem posição aberta"}
            accent="cyan"
          />
          <StatCard
            label="Retorno"
            value={`${status.total_return_pct >= 0 ? "+" : ""}${status.total_return_pct.toFixed(2)}%`}
            sub={`P&L não realizado: $${status.unrealized_pnl.toFixed(2)}`}
            accent={pnlColor}
          />
          <StatCard
            label="Win Rate"
            value={`${winRate}%`}
            sub={`${status.wins}W / ${status.losses}L · ${status.wins + status.losses} trades`}
            accent="yellow"
          />
        </div>

        {/* Chart + Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PriceChart data={priceHistory} />
          </div>
          <Indicators
            rsi={status.rsi}
            emaFast={status.ema_fast}
            emaSlow={status.ema_slow}
            signal={status.signal}
          />
        </div>

        {/* Trades + Config */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TradeHistory trades={status.trades} />
          <ConfigPanel />
        </div>

        {/* Open position */}
        {status.crypto_held > 0 && (
          <div className="card-border rounded-lg p-4 border-l-2 border-l-yellow/60 glow-blue">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-dim uppercase tracking-[0.12em]">Posição Aberta</span>
                <span className="text-yellow text-sm font-mono" suppressHydrationWarning>
                  {status.crypto_held.toFixed(6)} BTC — Entrada @{" "}
                  ${status.entry_price.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <div className={clsx(
                  "text-xl font-display font-700",
                  status.unrealized_pnl >= 0 ? "text-green text-glow-green" : "text-red text-glow-red"
                )}>
                  {status.unrealized_pnl >= 0 ? "+" : ""}${status.unrealized_pnl.toFixed(2)}
                </div>
                <div className="text-[10px] text-dim mt-0.5">P&L não realizado</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────── */}
      <footer className="display-block border-t border-border/40 px-6 py-3 flex items-center justify-between">
        <span className="text-[#253040] text-[10px] font-mono tracking-wide">
          PAPER TRADING — Nenhum dinheiro real envolvido
        </span>
        <span className="text-[#253040] text-[10px] font-mono" suppressHydrationWarning>
          Binance API · {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
