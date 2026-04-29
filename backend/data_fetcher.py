"""
DataFetcher - Recolha de dados via Bybit API pública
Não requer API Key para dados de mercado.
"""

import logging
import requests
import pandas as pd

logger = logging.getLogger(__name__)

BYBIT_BASE_URL = "https://api.bybit.com"

INTERVAL_MAP = {
    "1m": "1",
    "3m": "3",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
}


class DataFetcher:
    def __init__(self, config):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def get_klines(self) -> pd.DataFrame | None:
        """Obtém velas (OHLCV) da Bybit para o par configurado."""
        try:
            interval = INTERVAL_MAP.get(self.config.INTERVAL, "1")
            url = f"{BYBIT_BASE_URL}/v5/market/kline"
            params = {
                "category": "spot",
                "symbol": self.config.SYMBOL,
                "interval": interval,
                "limit": self.config.KLINES_LIMIT,
            }
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            if data.get("retCode") != 0:
                logger.error(f"Bybit API error: {data.get('retMsg')}")
                return None

            # Bybit devolve dados do mais recente para o mais antigo — inverter
            klines = list(reversed(data["result"]["list"]))

            df = pd.DataFrame(klines, columns=[
                "open_time", "open", "high", "low", "close", "volume", "turnover"
            ])

            for col in ["open", "high", "low", "close", "volume"]:
                df[col] = df[col].astype(float)

            df["open_time"] = pd.to_datetime(df["open_time"].astype(int), unit="ms")
            df.set_index("open_time", inplace=True)

            logger.debug(f"Dados obtidos: {len(df)} velas | Último fecho: {df['close'].iloc[-1]:.4f}")
            return df

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao obter klines: {e}")
            return None

    def get_ticker_price(self) -> float | None:
        """Obtém o preço atual do par."""
        try:
            url = f"{BYBIT_BASE_URL}/v5/market/tickers"
            params = {"category": "spot", "symbol": self.config.SYMBOL}
            response = self.session.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            if data.get("retCode") == 0:
                return float(data["result"]["list"][0]["lastPrice"])
            return None
        except Exception as e:
            logger.error(f"Erro ao obter preço: {e}")
            return None
