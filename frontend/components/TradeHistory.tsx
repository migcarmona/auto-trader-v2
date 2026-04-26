"use client";

import { Trade } from "@/hooks/useBotData";
import clsx from "clsx";

interface TradeHistoryProps {
  trades: Trade[];
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
  const sells = trades.filter((t) => t.type === "SELL").reverse();

  return (
    <div className="card-border rounded-lg p-4 flex flex-col gap-3">
      <span className="text-dim text-xs uppercase tracking-widest">Histórico de Trades</span>

      {sells.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <span className="text-dim text-xs">Nenhum trade realizado ainda</span>
          <span className="text-muted text-xs">O bot vai registar aqui cada operação</span>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-64 flex flex-col gap-2">
          {sells.map((trade, i) => (
            <div key={i} className={clsx(
              "flex items-center justify-between px-3 py-2 rounded border text-xs font-mono animate-slide-up",
              (trade.pnl ?? 0) >= 0
                ? "border-green/20 bg-green/5"
                : "border-red/20 bg-red/5"
            )}>
              <div className="flex flex-col gap-0.5">
                <span className={clsx(
                  "font-600 text-xs",
                  (trade.pnl ?? 0) >= 0 ? "text-green" : "text-red"
                )}>
                  {(trade.pnl ?? 0) >= 0 ? "▲ WIN" : "▼ LOSS"}
                </span>
                <span className="text-dim">{new Date(trade.time).toLocaleTimeString("pt-PT")}</span>
              </div>
              <div className="text-center">
                <div className="text-text">${trade.price.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</div>
                <div className="text-dim">{trade.quantity.toFixed(6)} BTC</div>
              </div>
              <div className="text-right">
                <div className={clsx((trade.pnl ?? 0) >= 0 ? "text-green" : "text-red")}>
                  {(trade.pnl ?? 0) >= 0 ? "+" : ""}${(trade.pnl ?? 0).toFixed(2)}
                </div>
                <div className="text-dim">
                  {(trade.pnl_pct ?? 0) >= 0 ? "+" : ""}{(trade.pnl_pct ?? 0).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
