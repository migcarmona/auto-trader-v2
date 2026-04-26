"use client";

import { Trade } from "@/hooks/useBotData";
import clsx from "clsx";

interface TradeHistoryProps {
  trades: Trade[];
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
  const sells = trades.filter((t) => t.type === "SELL").reverse();
  const wins = sells.filter((t) => (t.pnl ?? 0) >= 0).length;
  const losses = sells.length - wins;

  return (
    <div className="card-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-dim uppercase tracking-[0.12em]">Histórico de Trades</span>
        {sells.length > 0 && (
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-green">{wins}W</span>
            <span className="text-[#2a3448]">/</span>
            <span className="text-red">{losses}L</span>
          </div>
        )}
      </div>

      {sells.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <div className="text-[#2a3448] text-2xl select-none">◈</div>
          <span className="text-dim text-xs">Nenhum trade realizado ainda</span>
          <span className="text-[#2a3448] text-[10px]">As operações aparecem aqui em tempo real</span>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-64 flex flex-col gap-1.5 pr-0.5">
          {sells.map((trade, i) => {
            const win = (trade.pnl ?? 0) >= 0;
            return (
              <div
                key={i}
                className={clsx(
                  "flex items-center justify-between px-3 py-2.5 rounded border text-xs font-mono animate-slide-up",
                  win ? "border-green/15 bg-green/[0.04]" : "border-red/15 bg-red/[0.04]"
                )}
              >
                {/* Side badge + time */}
                <div className="flex flex-col gap-0.5 min-w-[56px]">
                  <span className={clsx("font-600 text-[10px] tracking-wider", win ? "text-green" : "text-red")}>
                    {win ? "▲ WIN" : "▼ LOSS"}
                  </span>
                  <span className="text-[#3a4a60] text-[9px]">
                    {new Date(trade.time).toLocaleTimeString("pt-PT")}
                  </span>
                </div>

                {/* Price + qty */}
                <div className="text-center">
                  <div className="text-text text-[11px]">
                    ${trade.price.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[#3a4a60] text-[9px]">{trade.quantity.toFixed(5)} BTC</div>
                </div>

                {/* PnL */}
                <div className="text-right">
                  <div className={clsx("font-600", win ? "text-green" : "text-red")}>
                    {win ? "+" : ""}${(trade.pnl ?? 0).toFixed(2)}
                  </div>
                  <div className={clsx("text-[9px]", win ? "text-green/60" : "text-red/60")}>
                    {(trade.pnl_pct ?? 0) >= 0 ? "+" : ""}{(trade.pnl_pct ?? 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
