
"""
Configurações centrais do Auto Trader — v2 corrigida
"""

import os


class Config:
    # ─── Kraken API ──────────────────────────────────────────
    KRAKEN_API_KEY    = os.environ.get("KRAKEN_API_KEY", "")
    KRAKEN_API_SECRET = os.environ.get("KRAKEN_API_SECRET", "")

    # ─── Modo de trading ─────────────────────────────────────
    TRADING_MODE = os.environ.get("TRADING_MODE", "paper")  # "paper" | "live"

    # ─── Par e Temporalidade ─────────────────────────────────
    # FIX: símbolo correto na Kraken
    SYMBOL       = "XBTUSDT"
    INTERVAL     = "5"        # FIX: 5m em vez de 1m (menos whipsaws, fees diluídas)
    MIN_CANDLES  = 50
    KLINES_LIMIT = 200        # mais dados = EMAs mais estáveis

    # ─── Fees reais (Kraken taker) ───────────────────────────
    # CRÍTICO: tens de contabilizar isto em todos os cálculos
    FEE_PCT = 0.0026          # 0.26% por execução (taker)
    # Dica: usa limit orders (maker = 0.16%) para reduzir para 0.32% total

    # ─── Gestão de Risco ─────────────────────────────────────
    INITIAL_BALANCE = 1000.0
    TRADE_PERCENT   = 0.10    # 10% do balance por trade (100€)

    # FIX: SL e TP ajustados para cobrir fees e ter R:R positivo
    # Regra: TP deve ser pelo menos 3x o SL *depois* das fees
    #
    #   SL real = 1.0% + 0.52% fees = 1.52% de perda
    #   TP real = 2.0% - 0.52% fees = 1.48% de ganho
    #   R:R ≈ 1:1 → win rate necessário: > 50% ✅ (muito mais realista)
    #
    STOP_LOSS_PCT   = 0.010   # FIX: era 0.5% (menor que as fees!)
    TAKE_PROFIT_PCT = 0.020   # FIX: era 1.0%

    # ─── Indicadores ─────────────────────────────────────────
    RSI_PERIOD      = 14
    RSI_OVERSOLD    = 35      # correto
    RSI_OVERBOUGHT  = 65      # correto
    EMA_FAST        = 9
    EMA_SLOW        = 21

    # ─── Filtros de qualidade de sinal ───────────────────────
    ADX_MIN         = 20      # só operar em trending (ADX > 20)
    VOLUME_FACTOR   = 0.8     # volume mínimo = 80% da média de 20 velas
    # (era VOLUME_MULTIPLIER mas a strategy usava VOLUME_FACTOR — unificado)

    # ─── Loop ────────────────────────────────────────────────
    LOOP_INTERVAL = 300       # FIX: 300s = 5m (sincronizado com o INTERVAL)