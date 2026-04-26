"use client";

import { useBotData } from "@/hooks/useBotData";
import StatCard from "@/components/StatCard";
import PriceChart from "@/components/PriceChart";
import TradeHistory from "@/components/TradeHistory";
import Indicators from "@/components/Indicators";
import ConfigPanel from "@/components/ConfigPanel";
import clsx from "clsx";

export default function Dashboard() {
  const { status, connected, priceHistory, startBot, stopBot } = useBotData(5000);

  const winRate = status.wins + status.losses > 0
    ? ((status.wins / (status.wins + status.losses)) * 100).toFixed(1)
    : "—";

  const pnlColor = status.total_return_pct >= 0 ? "green" : "red";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 bg-bg/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-cyan/10 border border-cyan/30 flex items-center justify-center text-cyan text-sm">⌬</div>
          <span className="font-display font-700 text-sm tracking-widest uppercase text-text">AutoTrader</span>
          <span className="text-dim text-xs px-2 py-0.5 border border-border rounded">Scalping Bot</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Status de ligação */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className={clsx(
              "w-1.5 h-1.5 rounded-full",
              connected ? "bg-green animate-pulse" : "bg-red"
            )} />
            <span className="text-dim">{connected ? "LIGADO" : "OFFLINE — MODO DEMO"}</span>
          </div>

          {/* Botão start/stop */}
          <button
            onClick={status.running ? stopBot : startBot}
            className={clsx(
              "px-4 py-1.5 rounded text-xs font-mono font-600 tracking-widest uppercase border transition-all duration-200",
              status.running
                ? "border-red/40 bg-red/10 text-red hover:bg-red/20"
                : "border-green/40 bg-green/10 text-green hover:bg-green/20"
            )}
          >
            {status.running ? "■ PARAR" : "▶ INICIAR"}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">

        {/* Top bar — preço + estado */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-display font-800 text-4xl text-cyan cursor" suppressHydrationWarning>
              ${status.current_price.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-dim text-sm">{status.symbol}</span>
            <span className="text-dim text-xs border border-border rounded px-2 py-0.5">{status.interval}</span>
          </div>
          <div className="text-dim text-xs font-mono" suppressHydrationWarning>
            Atualizado: {new Date(status.last_updated).toLocaleTimeString("pt-PT")}
          </div>
        </div>

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
            sub={status.crypto_held > 0 ? `+ ${status.crypto_held.toFixed(6)} BTC` : "Sem posição aberta"}
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
            sub={`${status.wins}W / ${status.losses}L — ${status.wins + status.losses} trades`}
            accent="yellow"
          />
        </div>

        {/* Gráfico + Indicadores */}
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

        {/* Posição aberta */}
        {status.crypto_held > 0 && (
          <div className="card-border rounded-lg p-4 border-yellow/20 bg-yellow/5 glow-blue">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-dim text-xs uppercase tracking-widest">Posição Aberta</span>
                <span className="text-yellow text-sm font-mono" suppressHydrationWarning>
                  {status.crypto_held.toFixed(6)} BTC — Entrada @ ${status.entry_price.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <div className={clsx(
                  "text-lg font-display font-700",
                  status.unrealized_pnl >= 0 ? "text-green text-glow-green" : "text-red text-glow-red"
                )}>
                  {status.unrealized_pnl >= 0 ? "+" : ""}${status.unrealized_pnl.toFixed(2)}
                </div>
                <div className="text-dim text-xs">P&L não realizado</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-3 flex items-center justify-between">
        <span className="text-muted text-xs font-mono">PAPER TRADING — Nenhum dinheiro real envolvido</span>
        <span className="text-muted text-xs font-mono" suppressHydrationWarning>Binance API · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
