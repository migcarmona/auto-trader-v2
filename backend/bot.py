"""
Auto Trader - Scalping Bot (Kraken)
Modo configurável: paper | live
Estratégia: RSI + EMA + ADX
"""

import time
import logging
from datetime import datetime
from config import Config
from strategy import ScalpingStrategy
from paper_trader import PaperTrader
from live_trader import LiveTrader
from data_fetcher import DataFetcher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)


def main():
    logger.info("=" * 50)
    logger.info("  AUTO TRADER - SCALPING BOT (KRAKEN)")
    logger.info("=" * 50)

    config   = Config()
    fetcher  = DataFetcher(config)
    strategy = ScalpingStrategy(config)

    # FIX: seleciona trader conforme o modo configurado
    if config.TRADING_MODE == "live":
        logger.info("🔴 MODO LIVE — ordens reais na Kraken")
        trader = LiveTrader(config)
    else:
        logger.info("📄 MODO PAPER — simulação sem dinheiro real")
        trader = PaperTrader(config)

    logger.info(
        f"Par: {config.SYMBOL} | Intervalo: {config.INTERVAL}m | "
        f"Saldo inicial: ${config.INITIAL_BALANCE:.2f} | "
        f"SL: {config.STOP_LOSS_PCT*100:.1f}% | TP: {config.TAKE_PROFIT_PCT*100:.1f}%"
    )

    iteration = 0

    while True:
        try:
            iteration += 1
            logger.info(
                f"--- Iteração #{iteration} | "
                f"{datetime.now().strftime('%H:%M:%S')} ---"
            )

            # 1. Obter dados de mercado
            df = fetcher.get_klines()
            if df is None or len(df) < config.MIN_CANDLES:
                logger.warning("Dados insuficientes, a aguardar...")
                time.sleep(config.LOOP_INTERVAL)
                continue

            current_price = float(df["close"].iloc[-1])
            logger.info(f"Preço atual: ${current_price:.4f}")

            # 2. STOP-LOSS / TAKE-PROFIT — SEMPRE verificado primeiro
            #    FIX: era elif — SL/TP só corria quando sinal era HOLD
            if trader.has_position():
                trader.check_sl_tp(current_price)

            # 3. Sinal da estratégia — só depois do SL/TP
            #    (posição pode ter sido fechada no passo anterior)
            if not trader.has_position():
                signal = strategy.get_signal(df)
                logger.info(f"Sinal: {signal}")

                if signal == "BUY":
                    trader.buy(current_price)
            else:
                # Ainda tem posição — verifica sinal de saída
                signal = strategy.get_signal(df)
                logger.info(f"Sinal: {signal}")

                if signal == "SELL":
                    trader.sell(current_price, reason="SIGNAL")

            # 4. Estado atual
            trader.print_status(current_price)

            time.sleep(config.LOOP_INTERVAL)

        except KeyboardInterrupt:
            logger.info("\nBot interrompido pelo utilizador.")
            trader.print_summary()
            break

        except Exception as e:
            logger.error(f"Erro inesperado: {e}", exc_info=True)
            time.sleep(30)  # FIX: era 10s — dá mais tempo para recuperar


if __name__ == "__main__":
    import os
    os.makedirs("logs", exist_ok=True)
    main()     
