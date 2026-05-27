
"""
LiveTrader - Execução de ordens reais via Kraken API
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
    "BTCUSDT":  "XBTUSD",
    "XBTUSDT":  "XBTUSD",   # FIX: símbolo correto do config.py
    "ETHUSDT":  "ETHUSD",
    "SOLUSDT":  "SOLUSD",
}


class LiveTrader:
    def __init__(self, config):
        self.config          = config
        self.api_key         = config.KRAKEN_API_KEY
        self.api_secret      = config.KRAKEN_API_SECRET
        self.session         = requests.Session()

        # FIX: fee real Kraken taker (usa 0.0016 se usares limit orders)
        self.FEE = getattr(config, "FEE_PCT", 0.0026)

        self.balance         = 0.0
        self.initial_balance = 0.0
        self.crypto_held     = 0.0
        self.entry_price     = 0.0
        self.entry_cost      = 0.0   # FIX: custo real de entrada com fee
        self.trades          = []
        self.wins            = 0
        self.losses          = 0

        # FIX: _sync_balance com tratamento de erro no arranque
        try:
            self._sync_balance()
            self.initial_balance = self.balance
        except Exception as e:
            logger.error(f"⚠️ Não foi possível sincronizar saldo no arranque: {e}")
            logger.error("Verifica as API keys e a conectividade com a Kraken.")
            raise

    def _kraken_pair(self) -> str:
        return SYMBOL_MAP.get(self.config.SYMBOL, "XBTUSD")

    def _sign(self, urlpath: str, data: dict) -> str:
        postdata = urllib.parse.urlencode(data)
        encoded  = (str(data["nonce"]) + postdata).encode()
        message  = urlpath.encode() + hashlib.sha256(encoded).digest()
        mac      = hmac.new(
            base64.b64decode(self.api_secret), message, hashlib.sha512
        )
        return base64.b64encode(mac.digest()).decode()

    def _post(self, endpoint: str, data: dict = None, retries: int = 3) -> dict:
        """POST com retry automático em caso de falha de rede."""
        data        = data or {}
        data["nonce"] = str(int(time.time() * 1000))
        urlpath     = f"/0/private/{endpoint}"
        headers     = {
            "API-Key":      self.api_key,
            "API-Sign":     self._sign(urlpath, data),
            "Content-Type": "application/x-www-form-urlencoded",
        }
        for attempt in range(1, retries + 1):
            try:
                res = self.session.post(
                    f"{KRAKEN_API_URL}{urlpath}",
                    data=data, headers=headers, timeout=10
                )
                res.raise_for_status()
                result = res.json()
                if result.get("error"):
                    logger.error(f"Kraken API error: {result['error']}")
                return result
            except Exception as e:
                logger.warning(f"Tentativa {attempt}/{retries} falhou: {e}")
                if attempt < retries:
                    time.sleep(2 ** attempt)  # backoff exponencial
                else:
                    raise

    def _get_fill_price(self, txid: str) -> float:
        """
        FIX: busca o preço de fill real da ordem, não o estimado.
        Retorna 0.0 se não conseguir (usa entry_price como fallback).
        """
        try:
            result = self._post("QueryOrders", {"txid": txid, "trades": True})
            order  = result.get("result", {}).get(txid, {})
            price  = float(order.get("price", 0))
            return price if price > 0 else 0.0
        except Exception as e:
            logger.warning(f"Não foi possível obter fill price: {e}")
            return 0.0

    def _sync_balance(self):
        result = self._post("Balance")
        b = result.get("result", {})
        self.balance     = float(b.get("ZUSD", b.get("USD", 0)))
        self.crypto_held = float(b.get("XXBT", b.get("XBT", 0)))
        logger.info(
            f"💳 Saldo Kraken: ${self.balance:.2f} USD | "
            f"{self.crypto_held:.6f} BTC"
        )

    def has_position(self) -> bool:
        return self.crypto_held > 0.0001

    def buy(self, price: float):
        amount_usd = self.balance * self.config.TRADE_PERCENT
        if amount_usd < 10:
            logger.warning("Saldo insuficiente (mínimo $10 na Kraken).")
            return

        # FIX: volume calculado já descontando fee de entrada
        fee_entry = amount_usd * self.FEE
        volume    = round((amount_usd - fee_entry) / price, 8)

        if volume < 0.0001:
            logger.warning(f"Volume {volume:.8f} BTC abaixo do mínimo da Kraken (0.0001).")
            return

        try:
            result = self._post("AddOrder", {
                "pair":      self._kraken_pair(),
                "type":      "buy",
                "ordertype": "market",
                "volume":    str(volume),
            })
            if result.get("error"):
                logger.error(f"Erro na ordem de compra: {result['error']}")
                return

            txid = result["result"]["txid"][0]

            # FIX: tenta obter preço de fill real
            time.sleep(1)  # pequena espera para a ordem ser processada
            fill_price = self._get_fill_price(txid) or price

            self.entry_price = fill_price
            self.entry_cost  = amount_usd   # FIX: custo total incluindo fee
            self.crypto_held = volume

            logger.info(
                f"🟢 COMPRA REAL | Fill: ${fill_price:.2f} | "
                f"Est: ${price:.2f} | Vol: {volume:.6f} BTC | "
                f"Fee: ${fee_entry:.2f} | txid: {txid}"
            )
            self.trades.append({
                "type":       "BUY",
                "price_est":  price,
                "price_fill": fill_price,
                "quantity":   volume,
                "cost":       amount_usd,
                "fee":        fee_entry,
                "time":       datetime.now().isoformat(),
                "txid":       txid,
            })
            self._sync_balance()

        except Exception as e:
            logger.error(f"Erro ao executar compra: {e}")

    def sell(self, price: float, reason: str = "SIGNAL"):
        if not self.has_position():
            return

        # FIX: sincroniza quantidade real antes de vender
        self._sync_balance()
        volume = round(self.crypto_held, 8)

        if volume < 0.0001:
            logger.warning("Quantidade insuficiente para vender.")
            return

        try:
            result = self._post("AddOrder", {
                "pair":      self._kraken_pair(),
                "type":      "sell",
                "ordertype": "market",
                "volume":    str(volume),
            })
            if result.get("error"):
                logger.error(f"Erro na ordem de venda: {result['error']}")
                return

            txid = result["result"]["txid"][0]

            time.sleep(1)
            fill_price = self._get_fill_price(txid) or price

            # FIX: P&L real com fee de saída e custo real de entrada
            revenue_gross = volume * fill_price
            fee_sell      = revenue_gross * self.FEE
            revenue_net   = revenue_gross - fee_sell
            pnl           = revenue_net - self.entry_cost
            pnl_pct       = (pnl / self.entry_cost) * 100 if self.entry_cost > 0 else 0

            if pnl >= 0:
                self.wins += 1
                emoji = "💰"
            else:
                self.losses += 1
                emoji = "📉"

            logger.info(
                f"{emoji} VENDA REAL [{reason}] | Fill: ${fill_price:.2f} | "
                f"P&L: ${pnl:+.2f} ({pnl_pct:+.2f}%) | "
                f"Fee saída: ${fee_sell:.2f} | txid: {txid}"
            )
            self.trades.append({
                "type":       "SELL",
                "reason":     reason,
                "price_est":  price,
                "price_fill": fill_price,
                "quantity":   volume,
                "revenue":    revenue_net,
                "fee":        fee_sell,
                "pnl":        pnl,
                "pnl_pct":    pnl_pct,
                "time":       datetime.now().isoformat(),
                "txid":       txid,
            })
            self.entry_price = 0.0
            self.entry_cost  = 0.0
            self._sync_balance()

        except Exception as e:
            logger.error(f"Erro ao executar venda: {e}")

    def check_sl_tp(self, current_price: float):
        """FIX: SL/TP calculado sobre P&L real incluindo fees dos dois lados."""
        if not self.has_position():
            return

        revenue_if_sold = self.crypto_held * current_price * (1 - self.FEE)
        pnl_real_pct    = (
            (revenue_if_sold - self.entry_cost) / self.entry_cost
            if self.entry_cost > 0 else 0
        )

        if pnl_real_pct <= -self.config.STOP_LOSS_PCT:
            logger.warning(
                f"🛑 STOP-LOSS | P&L real: {pnl_real_pct*100:.2f}% "
                f"(fees incluídas)"
            )
            self.sell(current_price, reason="STOP_LOSS")

        elif pnl_real_pct >= self.config.TAKE_PROFIT_PCT:
            logger.info(
                f"🎯 TAKE-PROFIT | P&L real: {pnl_real_pct*100:.2f}%"
            )
            self.sell(current_price, reason="TAKE_PROFIT")