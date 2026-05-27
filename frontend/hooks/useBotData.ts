"use client";

import { useState, useEffect, useCallback } from "react";

export interface Trade {
  type: "BUY" | "SELL";
  reason?: string;
  price: number;
  quantity: number;
  pnl?: number;
  pnl_pct?: number;
  fee?: number;
  time: string;
}

export interface BotStatus {
  running: boolean;
  trading_mode: "paper" | "live";
  symbol: string;
  interval: string;
  current_price: number;
  signal: "BUY" | "SELL" | "HOLD";
  balance: number;
  initial_balance: number;
  crypto_held: number;
  entry_price: number;
  unrealized_pnl: number;
  total_value: number;
  total_return_pct: number;
  wins: number;
  losses: number;
  trades: Trade[];
  rsi: number;
  ema_fast: number;
  ema_slow: number;
  last_updated: string;
}

// FIX: defaults corretos e seguros — usados como fallback em qualquer campo ausente
const INITIAL_STATUS: BotStatus = {
  running:          false,
  trading_mode:     "paper",
  symbol:           "XBTUSDT",   // FIX: era "BTCUSDT"
  interval:         "5",         // FIX: era "1m"
  current_price:    0,           // FIX: era 67500 hardcoded
  signal:           "HOLD",
  balance:          1000,
  initial_balance:  1000,
  crypto_held:      0,
  entry_price:      0,
  unrealized_pnl:   0,
  total_value:      1000,
  total_return_pct: 0,
  wins:             0,
  losses:           0,
  trades:           [],
  rsi:              50,
  ema_fast:         0,
  ema_slow:         0,
  last_updated:     "",
};

export function useBotData(pollInterval = 5000) {
  const [status, setStatus]           = useState<BotStatus>(INITIAL_STATUS);
  const [connected, setConnected]     = useState(false);
  const [priceHistory, setPriceHistory] = useState<{ time: string; price: number }[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const res  = await fetch("/api/bot/status", { cache: "no-store" });
      const json = await res.json();

      if (!json._connected) throw new Error("Backend offline");

      const { _connected: _, ...data } = json as BotStatus & { _connected: boolean };

      // FIX: merge com INITIAL_STATUS — campos ausentes da API nunca ficam undefined
      setStatus((prev) => ({ ...INITIAL_STATUS, ...prev, ...data }));
      setConnected(true);

      // Só adiciona ao histórico se tiver preço real
      if (data.current_price > 0) {
        setPriceHistory((prev) => {
          const next = [
            ...prev,
            {
              time: new Date().toLocaleTimeString("pt-PT", {
                hour: "2-digit", minute: "2-digit", second: "2-digit",
              }),
              price: data.current_price,
            },
          ];
          return next.slice(-60);
        });
      }

    } catch {
      // FIX: offline — não simula dados falsos, apenas marca como desligado
      // O mock anterior mostrava preços aleatórios e confundia o utilizador
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(id);
  }, [fetchStatus, pollInterval]);

  const startBot = async () => {
    try {
      await fetch("/api/bot/start", { method: "POST" });
      await fetchStatus();
    } catch { /* offline */ }
  };

  const stopBot = async () => {
    try {
      await fetch("/api/bot/stop", { method: "POST" });
      await fetchStatus();
    } catch { /* offline */ }
  };

  return { status, connected, priceHistory, startBot, stopBot, refetch: fetchStatus };
}