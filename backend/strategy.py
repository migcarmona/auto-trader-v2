"""
Estratégia de Scalping: RSI + EMA Crossover + Filtro de Volume

Lógica de entrada (BUY):
  - EMA rápida cruza acima da EMA lenta (golden cross)
  - RSI abaixo do nível de sobrevenda (momentum de subida)
  - Volume acima da média (confirmação)

Lógica de saída (SELL):
  - EMA rápida cruza abaixo da EMA lenta (death cross)
  - RSI acima do nível de sobrecompra
  - Ou via Stop-Loss / Take-Profit (gerido no PaperTrader)
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
        """
        Retorna: "BUY", "SELL" ou "HOLD"
        """
        cfg = self.config

        # Calcular indicadores
        df = df.copy()
        df["rsi"] = self._calculate_rsi(df["close"], cfg.RSI_PERIOD)
        df["ema_fast"] = self._calculate_ema(df["close"], cfg.EMA_FAST)
        df["ema_slow"] = self._calculate_ema(df["close"], cfg.EMA_SLOW)
        df["vol_avg"] = df["volume"].rolling(20).mean()

        # Velas atuais e anteriores
        curr = df.iloc[-1]
        prev = df.iloc[-2]

        rsi = curr["rsi"]
        ema_fast = curr["ema_fast"]
        ema_slow = curr["ema_slow"]
        prev_ema_fast = prev["ema_fast"]
        prev_ema_slow = prev["ema_slow"]
        volume = curr["volume"]
        vol_avg = curr["vol_avg"]

        # Log dos indicadores
        logger.info(
            f"RSI: {rsi:.1f} | EMA{cfg.EMA_FAST}: {ema_fast:.2f} | "
            f"EMA{cfg.EMA_SLOW}: {ema_slow:.2f} | Vol: {volume:.2f} (avg: {vol_avg:.2f})"
        )

        # Filtro de volume
        volume_ok = volume >= vol_avg * cfg.VOLUME_MULTIPLIER

        # Golden Cross: EMA rápida cruza acima da lenta
        golden_cross = prev_ema_fast <= prev_ema_slow and ema_fast > ema_slow

        # Death Cross: EMA rápida cruza abaixo da lenta
        death_cross = prev_ema_fast >= prev_ema_slow and ema_fast < ema_slow

        # Condições de compra
        if golden_cross and rsi < cfg.RSI_OVERSOLD and volume_ok:
            logger.info("✅ Sinal BUY: Golden Cross + RSI oversold + Volume OK")
            return "BUY"

        # Condições de venda
        if death_cross and rsi > cfg.RSI_OVERBOUGHT:
            logger.info("🔴 Sinal SELL: Death Cross + RSI overbought")
            return "SELL"

        return "HOLD"
