# 🤖 Auto Trader — Scalping Bot (Binance)

Bot de scalping automático para a Binance em **modo paper trading** (simulação).

## 📁 Estrutura

```
auto-trader/
├── bot.py            # Ponto de entrada principal
├── config.py         # Todas as configurações
├── strategy.py       # Estratégia: RSI + EMA Crossover
├── data_fetcher.py   # Recolha de dados da Binance (API pública)
├── paper_trader.py   # Motor de simulação de ordens
├── requirements.txt
└── logs/
    ├── trader.log    # Log em tempo real
    └── trades.json   # Histórico de trades
```

## 🚀 Instalação

```bash
pip install -r requirements.txt
```

## ▶️ Execução

```bash
python bot.py
```

## ⚙️ Configuração (`config.py`)

| Parâmetro | Padrão | Descrição |
|---|---|---|
| `SYMBOL` | `BTCUSDT` | Par a negociar |
| `INTERVAL` | `1m` | Temporalidade das velas |
| `INITIAL_BALANCE` | `1000.0` | Saldo inicial simulado (USDT) |
| `TRADE_PERCENT` | `0.10` | % do saldo por trade |
| `STOP_LOSS_PCT` | `0.005` | Stop-loss (0.5%) |
| `TAKE_PROFIT_PCT` | `0.010` | Take-profit (1.0%) |
| `RSI_OVERSOLD` | `35` | Nível RSI para compra |
| `RSI_OVERBOUGHT` | `65` | Nível RSI para venda |
| `EMA_FAST` | `9` | EMA rápida |
| `EMA_SLOW` | `21` | EMA lenta |

## 📊 Estratégia

**Compra (BUY)** quando:
- EMA 9 cruza acima da EMA 21 (Golden Cross)
- RSI < 35 (zona de sobrevenda)
- Volume acima da média

**Venda (SELL)** quando:
- EMA 9 cruza abaixo da EMA 21 (Death Cross)
- RSI > 65 (zona de sobrecompra)
- Ou via Stop-Loss (−0.5%) / Take-Profit (+1.0%)

## ⚠️ Aviso

Este bot é apenas para fins educativos e de aprendizagem.
**Nunca** utilizes dinheiro real sem testes extensos e sem compreenderes os riscos do mercado de criptomoedas.
