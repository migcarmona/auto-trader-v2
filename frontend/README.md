# 📊 AutoTrader — Frontend (Next.js)

Dashboard completo para o bot de scalping em tempo real.

## 🗂 Estrutura

```
auto-trader-frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Dashboard principal
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── StatCard.tsx      # Cards de métricas
│   │   ├── PriceChart.tsx    # Gráfico de preço
│   │   ├── Indicators.tsx    # RSI + EMA
│   │   ├── TradeHistory.tsx  # Histórico de trades
│   │   └── ConfigPanel.tsx   # Configuração em tempo real
│   └── hooks/
│       └── useBotData.ts     # Polling de dados do bot
├── api_server.py             # API FastAPI (vai para /backend)
├── next.config.js
├── tailwind.config.js
└── package.json
```

## 🚀 Instalação

```bash
npm install
```

## ▶️ Execução

### 1. Arrancar o servidor Python (na pasta /backend)
```bash
pip install fastapi uvicorn --break-system-packages
python api_server.py
```

### 2. Arrancar o frontend
```bash
npm run dev
```

Abre em: **http://localhost:3000**

## ⚙️ Como funciona

- O frontend faz polling ao backend Python a cada 5 segundos (`/status`)
- O botão **INICIAR** chama `/start` e o bot começa a operar
- As configurações são enviadas via `/config` em tempo real
- Em modo offline (backend parado), o dashboard simula dados para demonstração
