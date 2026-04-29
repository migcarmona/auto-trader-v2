"use client";

import { useState, useEffect, useCallback } from "react";

export interface Trade {
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  pnl?: number;
  pnl_pct?: number;
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

const INITIAL_STATUS: BotStatus = {
  running: false,
  trading_mode: "paper",
  symbol: "BTCUSDT",
  interval: "1m",
  current_price: 67500,
  signal: "HOLD",
  balance: 1000,
  initial_balance: 1000,
  crypto_held: 0,
  entry_price: 0,
  unrealized_pnl: 0,
  total_value: 1000,
  total_return_pct: 0,
  wins: 0,
  losses: 0,
  trades: [],
  rsi: 50,
  ema_fast: 67486.65,
  ema_slow: 67635.15,
  last_updated: "1970-01-01T00:00:00.000Z",
};

function randomiseMock(base: BotStatus): BotStatus {
  const price = 67500 + (Math.random() - 0.5) * 400;
  const rsi = 30 + Math.random() * 40;
  return {
    ...base,
    current_price: price,
    rsi,
    ema_fast: price * 0.9998,
    ema_slow: price * 1.0002,
    last_updated: new Date().toISOString(),
  };
}

export function useBotData(pollInterval = 5000) {
  const [status, setStatus] = useState<BotStatus>(INITIAL_STATUS);
  const [connected, setConnected] = useState(false);
  const [priceHistory, setPriceHistory] = useState<{ time: string; price: number }[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/bot/status", { cache: "no-store" });
      const json = await res.json();
      if (!json._connected) throw new Error("Backend offline");
      const { _connected: _, ...data } = json as BotStatus & { _connected: boolean };
      setStatus(data);
      setConnected(true);
      setPriceHistory((prev) => {
        const next = [
          ...prev,
          { time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), price: data.current_price },
        ];
        return next.slice(-60); // últimos 60 pontos
      });
    } catch {
      setConnected(false);
      setStatus((prev) => {
        const isInitial = prev.last_updated === INITIAL_STATUS.last_updated;
        if (isInitial) return randomiseMock(prev);
        return {
          ...prev,
          current_price: prev.current_price + (Math.random() - 0.5) * 80,
          rsi: Math.max(10, Math.min(90, prev.rsi + (Math.random() - 0.5) * 3)),
          last_updated: new Date().toISOString(),
        };
      });
      setPriceHistory((prev) => {
        const last = prev[prev.length - 1];
        const newPrice = last ? last.price + (Math.random() - 0.5) * 80 : 67500;
        const next = [
          ...prev,
          { time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), price: newPrice },
        ];
        return next.slice(-60);
      });
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
      fetchStatus();
    } catch { /* offline */ }
  };

  const stopBot = async () => {
    try {
      await fetch("/api/bot/stop", { method: "POST" });
      fetchStatus();
    } catch { /* offline */ }
  };

  return { status, connected, priceHistory, startBot, stopBot, refetch: fetchStatus };
}
