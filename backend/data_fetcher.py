"""
DataFetcher - Recolha de dados da Binance via API pública
Não requer API Key para dados de mercado (klines).
"""

import logging
import requests
import pandas as pd

logger = logging.getLogger(__name__)

BINANCE_BASE_URL = "https://api.binance.com"


class DataFetcher:
    def __init__(self, config):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def get_klines(self) -> pd.DataFrame | None:
        """Obtém velas (OHLCV) da Binance para o par configurado."""
        try:
            url = f"{BINANCE_BASE_URL}/api/v3/klines"
            params = {
                "symbol": self.config.SYMBOL,
                "interval": self.config.INTERVAL,
                "limit": self.config.KLINES_LIMIT,
            }
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            df = pd.DataFrame(data, columns=[
                "open_time", "open", "high", "low", "close", "volume",
                "close_time", "quote_volume", "trades",
                "taker_buy_base", "taker_buy_quote", "ignore"
            ])

            # Converter tipos
            for col in ["open", "high", "low", "close", "volume"]:
                df[col] = df[col].astype(float)

            df["open_time"] = pd.to_datetime(df["open_time"], unit="ms")
            df.set_index("open_time", inplace=True)

            logger.debug(f"Dados obtidos: {len(df)} velas | Último fecho: {df['close'].iloc[-1]:.4f}")
            return df

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao obter klines: {e}")
            return None

    def get_ticker_price(self) -> float | None:
        """Obtém o preço atual do par."""
        try:
            url = f"{BINANCE_BASE_URL}/api/v3/ticker/price"
            params = {"symbol": self.config.SYMBOL}
            response = self.session.get(url, params=params, timeout=5)
            response.raise_for_status()
            return float(response.json()["price"])
        except Exception as e:
            logger.error(f"Erro ao obter preço: {e}")
            return None
