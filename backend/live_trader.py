"""
LiveTrader - Execução de ordens reais via Kraken API privada
As chaves API devem estar em variáveis de ambiente: KRAKEN_API_KEY, KRAKEN_API_SECRET
"""

import hashlib
import hmac
import base64
import urllib.parse
import time
import logging
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

KRAKEN_API_URL = "https://api.kraken.com"

SYMBOL_MAP = {
    "BTCUSDT": "XBTUSD",
    "ETHUSDT": "ETHUSD",
    "SOLUSDT": "SOLUSD",
}


class LiveTrader:
    def __init__(self, config):
        self.config = config
        self.api_key = config.KRAKEN_API_KEY
        self.api_secret = config.KRAKEN_API_SECRET
        self.session = requests.Session()

        self.balance = 0.0
        self.initial_balance = 0.0
        self.crypto_held = 0.0
        self.entry_price = 0.0
        self.trades = []
        self.wins = 0
        self.losses = 0

        self._sync_balance()
        self.initial_balance = self.balance

    def _kraken_pair(self) -> str:
        return SYMBOL_MAP.get(self.config.SYMBOL, "XBTUSD")

    def _sign(self, urlpath: str, data: dict) -> str:
        postdata = urllib.parse.urlencode(data)
        encoded = (str(data["nonce"]) + postdata).encode()
        message = urlpath.encode() + hashlib.sha256(encoded).digest()
        mac = hmac.new(base64.b64decode(self.api_secret), message, hashlib.sha512)
        return base64.b64encode(mac.digest()).decode()

    def _post(self, endpoint: str, data: dict = None) -> dict:
        data = data or {}
        data["nonce"] = str(int(time.time() * 1000))
        urlpath = f"/0/private/{endpoint}"
        headers = {
            "API-Key": self.api_key,
            "API-Sign": self._sign(urlpath, data),
            "Content-Type": "application/x-www-form-urlencoded",
        }
        res = self.session.post(
            f"{KRAKEN_API_URL}{urlpath}", data=data, headers=headers, timeout=10
        )
        res.raise_for_status()
        return res.json()

    def _sync_balance(self):
        try:
            result = self._post("Balance")
            if not result.get("error"):
                b = result["result"]
                self.balance = float(b.get("ZUSD", b.get("USD", 0)))
                self.crypto_held = float(b.get("XXBT", b.get("XBT", 0)))
                logger.info(f"Saldo Kraken: ${self.balance:.2f} USD | {self.crypto_held:.6f} BTC")
        except Exception as e:
            logger.error(f"Erro ao sincronizar saldo: {e}")

    def has_position(self) -> bool:
        return self.crypto_held > 0.0001  # margem mínima

    def buy(self, price: float):
        amount_usd = self.balance * self.config.TRADE_PERCENT
        if amount_usd < 10:
            logger.warning("Saldo insuficiente para comprar (mínimo $10).")
            return

        volume = round(amount_usd / price, 8)

        try:
            result = self._post("AddOrder", {
                "pair": self._kraken_pair(),
                "type": "buy",
                "ordertype": "market",
                "volume": str(volume),
            })
            if result.get("error"):
                logger.error(f"Erro na ordem de compra: {result['error']}")
                return

            txid = result["result"]["txid"][0] if result.get("result") else "?"
            self.entry_price = price
            logger.info(f"🟢 COMPRA REAL | ${price:.2f} | {volume:.6f} BTC | txid: {txid}")
            self.trades.append({
                "type": "BUY", "price": price, "quantity": volume,
                "time": datetime.now().isoformat(), "txid": txid,
            })
            self._sync_balance()
        except Exception as e:
            logger.error(f"Erro ao executar compra: {e}")

    def sell(self, price: float):
        if not self.has_position():
            return

        volume = round(self.crypto_held, 8)
        cost = volume * self.entry_price
        revenue = volume * price * 0.999  # 0.1% fee
        pnl = revenue - cost
        pnl_pct = (pnl / cost) * 100 if cost > 0 else 0

        try:
            result = self._post("AddOrder", {
                "pair": self._kraken_pair(),
                "type": "sell",
                "ordertype": "market",
                "volume": str(volume),
            })
            if result.get("error"):
                logger.error(f"Erro na ordem de venda: {result['error']}")
                return

            txid = result["result"]["txid"][0] if result.get("result") else "?"

            if pnl >= 0:
                self.wins += 1
                logger.info(f"💰 VENDA REAL | ${price:.2f} | P&L: +${pnl:.2f} ({pnl_pct:+.2f}%) | txid: {txid}")
            else:
                self.losses += 1
                logger.info(f"📉 VENDA REAL | ${price:.2f} | P&L: ${pnl:.2f} ({pnl_pct:+.2f}%) | txid: {txid}")

            self.trades.append({
                "type": "SELL", "price": price, "quantity": volume,
                "pnl": pnl, "pnl_pct": pnl_pct,
                "time": datetime.now().isoformat(), "txid": txid,
            })
            self.entry_price = 0.0
            self._sync_balance()
        except Exception as e:
            logger.error(f"Erro ao executar venda: {e}")

    def check_sl_tp(self, current_price: float):
        if not self.has_position():
            return
        change = (current_price - self.entry_price) / self.entry_price
        if change <= -self.config.STOP_LOSS_PCT:
            logger.warning(f"🛑 STOP-LOSS atingido ({change*100:.2f}%)")
            self.sell(current_price)
        elif change >= self.config.TAKE_PROFIT_PCT:
            logger.info(f"🎯 TAKE-PROFIT atingido ({change*100:.2f}%)")
            self.sell(current_price)
