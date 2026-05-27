"""
DataFetcher - Recolha de dados via Kraken API pública
"""

import logging
import requests
import pandas as pd

logger = logging.getLogger(__name__)

KRAKEN_BASE_URL = "https://api.kraken.com/0/public"

SYMBOL_MAP = {
    "BTCUSDT":  "XBTUSD",
    "XBTUSDT":  "XBTUSD",   # FIX: símbolo correto do config.py
    "ETHUSDT":  "ETHUSD",
    "XETHUSDT": "ETHUSD",
    "SOLUSDT":  "SOLUSD",
}

# FIX: aceita tanto "5m" como "5" (formato direto da Kraken)
INTERVAL_MAP = {
    "1": 1,   "1m": 1,
    "3": 3,   "3m": 3,
    "5": 5,   "5m": 5,
    "15": 15, "15m": 15,
    "30": 30, "30m": 30,
    "60": 60, "1h": 60,
}


class DataFetcher:
    def __init__(self, config):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json"})

        # Validação no arranque
        pair = self._kraken_pair()
        interval = INTERVAL_MAP.get(str(self.config.INTERVAL))
        if not interval:
            raise ValueError(
                f"INTERVAL '{config.INTERVAL}' inválido. "
                f"Usa: {list(INTERVAL_MAP.keys())}"
            )
        logger.info(f"DataFetcher pronto | Par: {pair} | Intervalo: {interval}m")

    def _kraken_pair(self) -> str:
        symbol = self.config.SYMBOL
        pair   = SYMBOL_MAP.get(symbol)
        if not pair:
            # FIX: erro explícito em vez de fallback silencioso
            raise ValueError(
                f"Símbolo '{symbol}' não mapeado. "
                f"Símbolos suportados: {list(SYMBOL_MAP.keys())}"
            )
        return pair

    def get_klines(self) -> pd.DataFrame | None:
        """Obtém velas OHLCV da Kraken."""
        try:
            # FIX: converte para string para garantir compatibilidade com o map
            interval = INTERVAL_MAP.get(str(self.config.INTERVAL), 5)
            params   = {
                "pair":     self._kraken_pair(),
                "interval": interval,
            }
            response = self.session.get(
                f"{KRAKEN_BASE_URL}/OHLC", params=params, timeout=10
            )
            response.raise_for_status()
            data = response.json()

            if data.get("error"):
                logger.error(f"Kraken API error: {data['error']}")
                return None

            result   = data["result"]
            pair_key = next(k for k in result if k != "last")
            klines   = result[pair_key][-self.config.KLINES_LIMIT:]

            df = pd.DataFrame(klines, columns=[
                "open_time", "open", "high", "low",
                "close", "vwap", "volume", "count"
            ])
            for col in ["open", "high", "low", "close", "volume"]:
                df[col] = df[col].astype(float)
            df["open_time"] = pd.to_datetime(
                df["open_time"].astype(int), unit="s"
            )
            df.set_index("open_time", inplace=True)

            logger.info(
                f"Dados obtidos: {len(df)} velas | "
                f"Último fecho: ${df['close'].iloc[-1]:.4f}"
            )
            return df

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro de rede ao obter klines: {e}")
            return None
        except Exception as e:
            logger.error(f"Erro inesperado no get_klines: {e}", exc_info=True)
            return None

    def get_ticker_price(self) -> float | None:
        """
        Preço atual (tick a tick) — usar no check_sl_tp do bot.py
        em vez do close da última vela.
        """
        try:
            params   = {"pair": self._kraken_pair()}
            response = self.session.get(
                f"{KRAKEN_BASE_URL}/Ticker", params=params, timeout=5
            )
            response.raise_for_status()
            data = response.json()

            if data.get("error"):
                logger.error(f"Kraken Ticker error: {data['error']}")
                return None

            pair_key = next(iter(data["result"]))
            price    = float(data["result"][pair_key]["c"][0])
            return price

        except Exception as e:
            logger.error(f"Erro ao obter preço atual: {e}")
            return None