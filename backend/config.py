"""
Configurações centrais do Auto Trader
Edita este ficheiro para ajustar o comportamento do bot.
"""


class Config:
    # ─── Exchange ────────────────────────────────────────────
    API_KEY = ""          # Deixa vazio em paper trading
    API_SECRET = ""       # Deixa vazio em paper trading
    TESTNET = False       # True = usa testnet da Binance

    # ─── Par e Temporalidade ─────────────────────────────────
    SYMBOL = "BTCUSDT"    # Par a negociar
    INTERVAL = "1m"       # Vela: 1m, 3m, 5m (scalping)
    MIN_CANDLES = 50      # Mínimo de velas para calcular indicadores

    # ─── Gestão de Risco ─────────────────────────────────────
    INITIAL_BALANCE = 1000.0    # Saldo simulado em USDT
    TRADE_PERCENT = 0.10        # % do saldo por trade (10%)
    STOP_LOSS_PCT = 0.005       # Stop-loss: 0.5%
    TAKE_PROFIT_PCT = 0.010     # Take-profit: 1.0%

    # ─── Indicadores (Estratégia Scalping) ───────────────────
    RSI_PERIOD = 14
    RSI_OVERSOLD = 35           # Sinal de compra abaixo deste valor
    RSI_OVERBOUGHT = 65         # Sinal de venda acima deste valor
    EMA_FAST = 9                # EMA rápida
    EMA_SLOW = 21               # EMA lenta
    VOLUME_MULTIPLIER = 1.2     # Volume mínimo vs média (filtro)

    # ─── Loop ────────────────────────────────────────────────
    LOOP_INTERVAL = 60          # Segundos entre iterações (1 min)
    KLINES_LIMIT = 100          # Número de velas a buscar
