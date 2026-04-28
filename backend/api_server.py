"""
API Server para o Auto Trader
Expõe o estado do bot via HTTP para o frontend Next.js consumir.

Instalar: pip install fastapi uvicorn --break-system-packages
Correr:   python api_server.py  (na pasta /backend)
"""

import os
import json
import threading
import logging
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ─── Importar o bot ──────────────────────────────────────
from config import Config
from strategy import ScalpingStrategy
from paper_trader import PaperTrader
from data_fetcher import DataFetcher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

app = FastAPI(title="AutoTrader API")

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Estado global do bot ────────────────────────────────
config = Config()
fetcher = DataFetcher(config)
strategy = ScalpingStrategy(config)
trader = PaperTrader(config)

bot_running = False
bot_thread: threading.Thread | None = None
last_signal = "HOLD"
last_price = 0.0
last_rsi = 50.0
last_ema_fast = 0.0
last_ema_slow = 0.0


def bot_loop():
    global bot_running, last_signal, last_price, last_rsi, last_ema_fast, last_ema_slow
    import time

    while bot_running:
        try:
            df = fetcher.get_klines()
            if df is None or len(df) < config.MIN_CANDLES:
                time.sleep(10)
                continue

            signal = strategy.get_signal(df)
            current_price = df["close"].iloc[-1]

            last_price = current_price
            last_signal = signal
            last_rsi = float(df["close"].ewm(com=config.RSI_PERIOD - 1).mean().iloc[-1])  # proxy
            last_ema_fast = float(df["close"].ewm(span=config.EMA_FAST, adjust=False).mean().iloc[-1])
            last_ema_slow = float(df["close"].ewm(span=config.EMA_SLOW, adjust=False).mean().iloc[-1])

            if signal == "BUY" and not trader.has_position():
                trader.buy(current_price)
            elif signal == "SELL" and trader.has_position():
                trader.sell(current_price)
            elif trader.has_position():
                trader.check_sl_tp(current_price)

        except Exception as e:
            logger.error(f"Erro no loop: {e}")

        time.sleep(config.LOOP_INTERVAL)


# ─── Endpoints ───────────────────────────────────────────

@app.get("/status")
def get_status():
    current_price = last_price or fetcher.get_ticker_price() or 0.0
    crypto_value = trader.crypto_held * current_price if trader.has_position() else 0.0
    unrealized = crypto_value - (trader.crypto_held * trader.entry_price) if trader.has_position() else 0.0
    total_value = trader.balance + crypto_value
    total_return = ((total_value - config.INITIAL_BALANCE) / config.INITIAL_BALANCE) * 100

    return {
        "running": bot_running,
        "symbol": config.SYMBOL,
        "interval": config.INTERVAL,
        "current_price": current_price,
        "signal": last_signal,
        "balance": trader.balance,
        "initial_balance": config.INITIAL_BALANCE,
        "crypto_held": trader.crypto_held,
        "entry_price": trader.entry_price,
        "unrealized_pnl": unrealized,
        "total_value": total_value,
        "total_return_pct": total_return,
        "wins": trader.wins,
        "losses": trader.losses,
        "trades": trader.trades,
        "rsi": last_rsi,
        "ema_fast": last_ema_fast,
        "ema_slow": last_ema_slow,
        "last_updated": datetime.now().isoformat(),
    }


@app.post("/start")
def start_bot():
    global bot_running, bot_thread
    if bot_running:
        return {"status": "already_running"}
    bot_running = True
    bot_thread = threading.Thread(target=bot_loop, daemon=True)
    bot_thread.start()
    logger.info("Bot iniciado via API")
    return {"status": "started"}


@app.post("/stop")
def stop_bot():
    global bot_running
    bot_running = False
    logger.info("Bot parado via API")
    return {"status": "stopped"}


@app.post("/config")
def update_config(body: dict):
    if "symbol" in body:       config.SYMBOL = body["symbol"]
    if "interval" in body:     config.INTERVAL = body["interval"]
    if "trade_percent" in body: config.TRADE_PERCENT = float(body["trade_percent"]) / 100
    if "stop_loss_pct" in body: config.STOP_LOSS_PCT = float(body["stop_loss_pct"]) / 100
    if "take_profit_pct" in body: config.TAKE_PROFIT_PCT = float(body["take_profit_pct"]) / 100
    if "rsi_oversold" in body: config.RSI_OVERSOLD = int(body["rsi_oversold"])
    if "rsi_overbought" in body: config.RSI_OVERBOUGHT = int(body["rsi_overbought"])
    logger.info(f"Config atualizada: {body}")
    return {"status": "ok", "config": body}


if __name__ == "__main__":
    import uvicorn
    Path("logs").mkdir(exist_ok=True)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
