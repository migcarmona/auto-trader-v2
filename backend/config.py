"""
Configurações centrais do Auto Trader
"""

import os


class Config:
    # ─── Kraken API ──────────────────────────────────────────
    KRAKEN_API_KEY = os.environ.get("KRAKEN_API_KEY", "")
    KRAKEN_API_SECRET = os.environ.get("KRAKEN_API_SECRET", "")

    # ─── Modo de trading ─────────────────────────────────────
    TRADING_MODE = os.environ.get("TRADING_MODE", "paper")  # "paper" | "live"

    # ─── Par e Temporalidade ─────────────────────────────────
    SYMBOL = "BTCUSDT"
    INTERVAL = "1m"
    MIN_CANDLES = 50

    # ─── Gestão de Risco ─────────────────────────────────────
    INITIAL_BALANCE = 1000.0
    TRADE_PERCENT = 0.10
    STOP_LOSS_PCT = 0.005
    TAKE_PROFIT_PCT = 0.010

    # ─── Indicadores ─────────────────────────────────────────
    RSI_PERIOD = 14
    RSI_OVERSOLD = 35
    RSI_OVERBOUGHT = 65
    EMA_FAST = 9
    EMA_SLOW = 21
    VOLUME_MULTIPLIER = 1.2

    # ─── Loop ────────────────────────────────────────────────
    LOOP_INTERVAL = 60
    KLINES_LIMIT = 100
