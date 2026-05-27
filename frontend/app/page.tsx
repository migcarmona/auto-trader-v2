"use client";

import { useBotData } from "@/hooks/useBotData";
import StatCard from "@/components/StatCard";
import PriceChart from "@/components/PriceChart";
import TradeHistory from "@/components/TradeHistory";
import Indicators from "@/components/Indicators";
import ConfigPanel from "@/components/ConfigPanel";
import WalletButton from "@/components/WalletButton";
import Link from "next/link";
import clsx from "clsx";

// FIX: helper para chamar .toFixed() com segurança
function fmt(value: number | undefined | null, decimals = 2): string {
  return (value ?? 0).toFixed(decimals);
}

export default function Dashboard() {
  const { status, connected, priceHistory, startBot, stopBot } = useBotData(5000);

  // FIX: defaults para todos os campos que podem ser undefined
  const balance         = status?.balance         ?? 0;
  const initialBalance  = status?.initial_balance  ?? 0;
  const totalValue      = status?.total_value      ?? 0;
  const totalReturnPct  = status?.total_return_pct ?? 0;
  const unrealizedPnl   = status?.unrealized_pnl   ?? 0;
  const cryptoHeld      = status?.crypto_held      ?? 0;
  const entryPrice      = status?.entry_price      ?? 0;
  const wins            = status?.wins             ?? 0;
  const losses          = status?.losses           ?? 0;
  const trades          = status?.trades           ?? [];
  const rsi             = status?.rsi              ?? 50;
  const emaFast         = status?.ema_fast         ?? 0;
  const emaSlow         = status?.ema_slow         ?? 0;
  const signal          = status?.signal           ?? "HOLD";
  const symbol          = status?.symbol           ?? "—";
  const interval        = status?.interval         ?? "—";
  const tradingMode     = status?.trading_mode     ?? "paper";
  const running         = status?.running          ?? false;
  const lastUpdated     = status?.last_updated;

  const winRate =
    wins + losses > 0
      ? ((wins / (wins + losses)) * 100).toFixed(1)
      : "—";

  const pnlColor = totalReturnPct >= 0 ? "green" : "red";

  const first = priceHistory[0]?.price;
  const last  = priceHistory[priceHistory.length - 1]?.price;
  const priceChangePct = first && last ? ((last - first) / first) * 100 : 0;

  return (
    <div className="min-h-screen w-full flex flex-col">

      {/* ── Header ─────────────────────────────── */}
      <header
        className="border-b border-border/60 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10"
        style={{ background: "rgba(9,11,15,0.92)", backdropFilter: "blur(16px)" }}
      >
        <Link href="https://www.astraxcoin.com" target="_blank" className="flex items-center gap-3">
          <img src="/favicon.ico" alt="Logo" className="w-6 h-6" />
          </Link>
          <div className="font-display font-700 text-sm tracking-widest uppercase text-cyan text-glow-cyan">Auto Trader</div>
          <div className="text-[12px] text-dim tracking-wide sm:flex-col">v2.0</div>

        <div id="buttons" className="flex items-center justify-end gap-4">
          {connected && (
            <span className={clsx(
              "text-[10px] font-mono font-600 px-2 py-0.5 rounded border tracking-wider uppercase",
              tradingMode === "live"
                ? "border-red/40 bg-red/10 text-red"
                : "border-blue/30 bg-blue/5 text-blue"
            )}>
              {tradingMode === "live" ? "⚠ LIVE" : "PAPER MONEY"}
            </span>
          )}
          <div className="flex items-center gap-2">
            <Link href="/profile" className="px-3 py-1.5 rounded border border-border/60 bg-surface text-dim text-[11px] font-mono tracking-wider uppercase hover:border-cyan/30 hover:text-text transition-all duration-200">
              Perfil
            </Link>
            <WalletButton />
          </div>
        </div>
      </header>

      {/* ── Price banner ───────────────────────── */}
      <div
        className="border-b border-border/40 flex items-center justify-between gap-5 p-6 max-w-7xl mx-auto w-full"
        style={{ background: "rgba(13,17,23,0.6)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 pl-4">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
            <span className="text-[10px] text-dim font-mono tracking-[0.15em]">LIVE</span>
          </div>

          <div className="flex items-baseline gap-2 text-dim text-xs font-mono border-l border-border pl-4">
            <span className="text-xs font-mono text-dim border-l border-border">{symbol}</span>
            <span className="text-[10px] text-dim px-1.5 py-0.5 bg-surface border border-border rounded">
              {interval}
            </span>
          </div>

          {/* FIX: só renderiza a hora se lastUpdated existir */}
          {lastUpdated && (
            <div className="text-dim text-xs font-mono border-l border-border pl-4" suppressHydrationWarning>
              {new Date(lastUpdated).toLocaleTimeString("pt-PT")}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-3">
          <button
            onClick={running ? stopBot : startBot}
            className={clsx(
              "px-4 py-1.5 rounded text-[11px] font-mono font-600 tracking-widest uppercase border transition-all duration-200",
              running
                ? "border-red/40 bg-red/10 text-red hover:bg-red/20 hover:border-red/60"
                : "border-green/40 bg-green/10 text-green hover:bg-green/20 hover:border-green/60"
            )}
          >
            {running ? "■ PARAR BOT" : "▶ INICIAR BOT"}
          </button>
          <div className={clsx(
            "w-1.5 h-1.5 rounded-full",
            connected ? "bg-green animate-pulse" : "bg-red"
          )} />
          <span className={clsx("text-[11px] font-mono", connected ? "text-dim" : "text-red/70")}>
            {connected ? "READY" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* ── Main ───────────────────────────────── */}
      <main className="flex-1 p-6 flex flex-col gap-5 max-w-7xl mx-auto w-full">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Saldo USDT"
            value={`$${fmt(balance)}`}
            sub={`Inicial: $${fmt(initialBalance)}`}
            accent="default"
          />
          <StatCard
            label="Valor Total"
            value={`$${fmt(totalValue)}`}
            sub={cryptoHeld > 0 ? `+${fmt(cryptoHeld, 6)} BTC` : "Sem posição aberta"}
            accent="cyan"
          />
          <StatCard
            label="Retorno"
            value={`${totalReturnPct >= 0 ? "+" : ""}${fmt(totalReturnPct)}%`}
            sub={`P&L não realizado: $${fmt(unrealizedPnl)}`}
            accent={pnlColor}
          />
          <StatCard
            label="Win Rate"
            value={winRate === "—" ? "—" : `${winRate}%`}
            sub={`${wins}W / ${losses}L · ${wins + losses} trades`}
            accent="yellow"
          />
        </div>

        {/* Chart + Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PriceChart data={priceHistory} />
          </div>
          <Indicators
            rsi={rsi}
            emaFast={emaFast}
            emaSlow={emaSlow}
            signal={signal}
          />
        </div>

        {/* Trades + Config */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TradeHistory trades={trades} />
          <ConfigPanel />
        </div>

        {/* FIX: posição aberta só renderiza se cryptoHeld > 0 */}
        {cryptoHeld > 0 && (
          <div className="card-border rounded-lg p-4 border-l-2 border-l-yellow/60 glow-blue">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-dim uppercase tracking-[0.12em]">Posição Aberta</span>
                <span className="text-yellow text-sm font-mono" suppressHydrationWarning>
                  {fmt(cryptoHeld, 6)} BTC — Entrada @ ${entryPrice.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <div className={clsx(
                  "text-xl font-display font-700",
                  unrealizedPnl >= 0 ? "text-green text-glow-green" : "text-red text-glow-red"
                )}>
                  {unrealizedPnl >= 0 ? "+" : ""}${fmt(unrealizedPnl)}
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
          2026 - Powered by{" "}
          <a href="https://astraxcoin.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            AstraX Coin
          </a>
        </span>
        {/* FIX: "Binance API" → "Kraken API" */}
        <span className="text-[#253040] text-[10px] font-mono" suppressHydrationWarning>
          Kraken API · {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}