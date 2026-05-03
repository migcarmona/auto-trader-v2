"""
Estratégia de Scalping: RSI + EMA Crossover

Lógica de entrada (BUY):
  - EMA rápida cruza acima da EMA lenta (golden cross)
  - RSI abaixo do limiar configurado (padrão: 45)

Lógica de saída (SELL):
  - EMA rápida cruza abaixo da EMA lenta (death cross)
  - RSI acima do limiar configurado (padrão: 55)
  - Ou via Stop-Loss / Take-Profit (gerido no Trader)
"""

import logging
import pandas as pd

logger = logging.getLogger(__name__)


class ScalpingStrategy:
    def __init__(self, config):
        self.config = config

    def _calculate_rsi(self, series: pd.Series, period: int) -> pd.Series:
        delta = series.diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)
        avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
        avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
        rs = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))

    def _calculate_ema(self, series: pd.Series, period: int) -> pd.Series:
        return series.ewm(span=period, adjust=False).mean()

    def get_signal(self, df: pd.DataFrame) -> str:
        cfg = self.config

        df = df.copy()
        df["rsi"] = self._calculate_rsi(df["close"], cfg.RSI_PERIOD)
        df["ema_fast"] = self._calculate_ema(df["close"], cfg.EMA_FAST)
        df["ema_slow"] = self._calculate_ema(df["close"], cfg.EMA_SLOW)

        curr = df.iloc[-1]
        prev = df.iloc[-2]

        rsi       = curr["rsi"]
        ema_fast  = curr["ema_fast"]
        ema_slow  = curr["ema_slow"]
        pema_fast = prev["ema_fast"]
        pema_slow = prev["ema_slow"]

        logger.info(
            f"RSI: {rsi:.1f} | EMA{cfg.EMA_FAST}: {ema_fast:.2f} | "
            f"EMA{cfg.EMA_SLOW}: {ema_slow:.2f}"
        )

        golden_cross = pema_fast <= pema_slow and ema_fast > ema_slow
        death_cross  = pema_fast >= pema_slow and ema_fast < ema_slow

        if golden_cross and rsi < cfg.RSI_OVERSOLD:
            logger.info(f"✅ BUY — Golden Cross + RSI {rsi:.1f} < {cfg.RSI_OVERSOLD}")
            return "BUY"

        if death_cross and rsi > cfg.RSI_OVERBOUGHT:
            logger.info(f"🔴 SELL — Death Cross + RSI {rsi:.1f} > {cfg.RSI_OVERBOUGHT}")
            return "SELL"

        return "HOLD"
