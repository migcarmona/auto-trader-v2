"""
Estratégia de Scalping Melhorada: RSI + EMA + ADX (filtro de tendência)

Melhorias:
  - RSI thresholds corretos (70/30 em vez de 55/45)
  - ADX como filtro de regime (só opera em mercados trending)
  - Confirmação de volume (evita sinais em baixo volume)
  - RSI usado como sinal principal, EMA como filtro direcional
"""

import logging
import pandas as pd
import numpy as np

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

    def _calculate_adx(self, df: pd.DataFrame, period: int = 14) -> pd.Series:
        """ADX — mede a FORÇA da tendência (não a direção)"""
        high = df["high"]
        low  = df["low"]
        close = df["close"]

        plus_dm  = high.diff()
        minus_dm = low.diff().abs()

        plus_dm  = plus_dm.where((plus_dm > minus_dm) & (plus_dm > 0), 0.0)
        minus_dm = minus_dm.where((minus_dm > plus_dm.abs()) & (minus_dm > 0), 0.0)

        tr = pd.concat([
            high - low,
            (high - close.shift()).abs(),
            (low  - close.shift()).abs()
        ], axis=1).max(axis=1)

        atr      = tr.ewm(span=period, adjust=False).mean()
        plus_di  = 100 * plus_dm.ewm(span=period, adjust=False).mean() / atr
        minus_di = 100 * minus_dm.ewm(span=period, adjust=False).mean() / atr

        dx  = (100 * (plus_di - minus_di).abs() / (plus_di + minus_di))
        adx = dx.ewm(span=period, adjust=False).mean()
        return adx

    def _calculate_atr(self, df: pd.DataFrame, period: int = 14) -> pd.Series:
        """ATR — para validar volatilidade mínima"""
        high, low, close = df["high"], df["low"], df["close"]
        tr = pd.concat([
            high - low,
            (high - close.shift()).abs(),
            (low  - close.shift()).abs()
        ], axis=1).max(axis=1)
        return tr.ewm(span=period, adjust=False).mean()

    def get_signal(self, df: pd.DataFrame) -> str:
        cfg = self.config

        # Precisa de colunas: open, high, low, close, volume
        if len(df) < 50:
            return "HOLD"

        df = df.copy()
        df["rsi"]      = self._calculate_rsi(df["close"], cfg.RSI_PERIOD)
        df["ema_fast"] = self._calculate_ema(df["close"], cfg.EMA_FAST)
        df["ema_slow"] = self._calculate_ema(df["close"], cfg.EMA_SLOW)
        df["adx"]      = self._calculate_adx(df, period=14)
        df["atr"]      = self._calculate_atr(df, period=14)
        df["vol_ma"]   = df["volume"].rolling(20).mean()

        curr = df.iloc[-1]
        prev = df.iloc[-2]

        rsi       = curr["rsi"]
        ema_fast  = curr["ema_fast"]
        ema_slow  = curr["ema_slow"]
        pema_fast = prev["ema_fast"]
        pema_slow = prev["ema_slow"]
        adx       = curr["adx"]
        volume    = curr["volume"]
        vol_ma    = curr["vol_ma"]

        logger.info(
            f"RSI: {rsi:.1f} | EMA{cfg.EMA_FAST}: {ema_fast:.4f} | "
            f"EMA{cfg.EMA_SLOW}: {ema_slow:.4f} | ADX: {adx:.1f} | "
            f"Vol ratio: {volume/vol_ma:.2f}x"
        )

        # ─── FILTROS GLOBAIS ───────────────────────────────────────────
        # 1. Só opera quando há tendência (ADX > 20 = trending)
        #    ADX < 20 = sideways → crossovers são whipsaws
        if adx < getattr(cfg, "ADX_MIN", 20):
            logger.info(f"⏸ HOLD — Mercado sideways (ADX {adx:.1f} < 20)")
            return "HOLD"

        # 2. Volume acima da média (evita sinais em zonas de baixa liquidez)
        if volume < vol_ma * getattr(cfg, "VOLUME_FACTOR", 0.8):
            logger.info(f"⏸ HOLD — Volume baixo ({volume/vol_ma:.2f}x da média)")
            return "HOLD"

        # ─── SINAIS ────────────────────────────────────────────────────
        golden_cross = pema_fast <= pema_slow and ema_fast > ema_slow
        death_cross  = pema_fast >= pema_slow and ema_fast < ema_slow

        # BUY: Golden cross + RSI não sobrecomprado (< 70) + tendência confirmada
        if golden_cross and rsi < 70:
            logger.info(f"✅ BUY — Golden Cross + RSI {rsi:.1f} + ADX {adx:.1f}")
            return "BUY"

        # SELL: Death cross + RSI não sobrevendido (> 30) + tendência confirmada
        if death_cross and rsi > 30:
            logger.info(f"🔴 SELL — Death Cross + RSI {rsi:.1f} + ADX {adx:.1f}")
            return "SELL"

        return "HOLD"
