"""
DataFetcher - Recolha de dados via Kraken API pública
Não requer API Key para dados de mercado.
"""

import logging
import requests
import pandas as pd

logger = logging.getLogger(__name__)

KRAKEN_BASE_URL = "https://api.kraken.com/0/public"

SYMBOL_MAP = {
    "BTCUSDT": "XBTUSD",
    "ETHUSDT": "ETHUSD",
    "SOLUSDT": "SOLUSD",
    "BNBUSDT": "XBTUSD",  # fallback para BTC
}

INTERVAL_MAP = {
    "1m": 1,
    "3m": 3,
    "5m": 5,
    "15m": 15,
    "30m": 30,
    "1h": 60,
}


class DataFetcher:
    def __init__(self, config):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json"})

    def _kraken_pair(self) -> str:
        return SYMBOL_MAP.get(self.config.SYMBOL, "XBTUSD")

    def get_klines(self) -> pd.DataFrame | None:
        """Obtém velas (OHLCV) da Kraken para o par configurado."""
        try:
            interval = INTERVAL_MAP.get(self.config.INTERVAL, 1)
            url = f"{KRAKEN_BASE_URL}/OHLC"
            params = {"pair": self._kraken_pair(), "interval": interval}
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            if data.get("error"):
                logger.error(f"Kraken API error: {data['error']}")
                return None

            result = data["result"]
            pair_key = next(k for k in result if k != "last")
            klines = result[pair_key][-self.config.KLINES_LIMIT:]

            df = pd.DataFrame(klines, columns=[
                "open_time", "open", "high", "low", "close", "vwap", "volume", "count"
            ])
            for col in ["open", "high", "low", "close", "volume"]:
                df[col] = df[col].astype(float)
            df["open_time"] = pd.to_datetime(df["open_time"].astype(int), unit="s")
            df.set_index("open_time", inplace=True)

            logger.info(f"Dados obtidos: {len(df)} velas | Último fecho: {df['close'].iloc[-1]:.4f}")
            return df

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao obter klines: {e}")
            return None

    def get_ticker_price(self) -> float | None:
        """Obtém o preço atual do par."""
        try:
            url = f"{KRAKEN_BASE_URL}/Ticker"
            params = {"pair": self._kraken_pair()}
            response = self.session.get(url, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            if not data.get("error"):
                pair_key = next(iter(data["result"]))
                return float(data["result"][pair_key]["c"][0])
            return None
        except Exception as e:
            logger.error(f"Erro ao obter preço: {e}")
            return None
