"""
Auto Trader - Scalping Bot para Binance
Modo: Paper Trading (Simulação)
Estratégia: RSI + EMA Crossover para scalping
"""

import time
import logging
from datetime import datetime
from config import Config
from strategy import ScalpingStrategy
from paper_trader import PaperTrader
from data_fetcher import DataFetcher

# Configurar logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


def main():
    logger.info("=" * 50)
    logger.info("  AUTO TRADER - SCALPING BOT (PAPER MODE)")
    logger.info("=" * 50)

    config = Config()
    fetcher = DataFetcher(config)
    strategy = ScalpingStrategy(config)
    trader = PaperTrader(config)

    logger.info(f"Par: {config.SYMBOL} | Intervalo: {config.INTERVAL} | Saldo inicial: ${config.INITIAL_BALANCE:.2f}")
    logger.info("A iniciar loop de trading...\n")

    iteration = 0

    while True:
        try:
            iteration += 1
            logger.info(f"--- Iteração #{iteration} | {datetime.now().strftime('%H:%M:%S')} ---")

            # 1. Obter dados de mercado
            df = fetcher.get_klines()
            if df is None or len(df) < config.MIN_CANDLES:
                logger.warning("Dados insuficientes, a aguardar...")
                time.sleep(config.LOOP_INTERVAL)
                continue

            # 2. Calcular indicadores e sinal
            signal = strategy.get_signal(df)
            current_price = df["close"].iloc[-1]

            logger.info(f"Preço atual: ${current_price:.4f} | Sinal: {signal}")

            # 3. Executar ordem (paper)
            if signal == "BUY" and not trader.has_position():
                trader.buy(current_price)

            elif signal == "SELL" and trader.has_position():
                trader.sell(current_price)

            # 4. Verificar stop-loss / take-profit
            elif trader.has_position():
                trader.check_sl_tp(current_price)

            # 5. Mostrar estado
            trader.print_status(current_price)

            time.sleep(config.LOOP_INTERVAL)

        except KeyboardInterrupt:
            logger.info("\nBot interrompido pelo utilizador.")
            trader.print_summary()
            break
        except Exception as e:
            logger.error(f"Erro inesperado: {e}")
            time.sleep(10)


if __name__ == "__main__":
    import os
    os.makedirs("logs", exist_ok=True)
    main()
