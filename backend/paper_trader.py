"""
PaperTrader - Simulador de ordens para paper trading
Regista todas as operações e calcula P&L em tempo real.
"""

import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class PaperTrader:
    def __init__(self, config):
        self.config = config
        self.balance = config.INITIAL_BALANCE   # USDT disponível
        self.crypto_held = 0.0                  # Quantidade de crypto
        self.entry_price = 0.0                  # Preço de entrada
        self.trades = []                         # Histórico de trades
        self.wins = 0
        self.losses = 0

    def has_position(self) -> bool:
        return self.crypto_held > 0

    def buy(self, price: float):
        """Executa ordem de compra simulada."""
        amount_usdt = self.balance * self.config.TRADE_PERCENT
        if amount_usdt < 1:
            logger.warning("Saldo insuficiente para comprar.")
            return

        fee = amount_usdt * 0.001  # 0.1% fee Binance
        amount_usdt_after_fee = amount_usdt - fee
        quantity = amount_usdt_after_fee / price

        self.crypto_held = quantity
        self.entry_price = price
        self.balance -= amount_usdt

        logger.info(
            f"🟢 COMPRA | Preço: ${price:.4f} | "
            f"Quantidade: {quantity:.6f} | Custo: ${amount_usdt:.2f} | Fee: ${fee:.4f}"
        )

        self.trades.append({
            "type": "BUY",
            "price": price,
            "quantity": quantity,
            "time": datetime.now().isoformat(),
        })

    def sell(self, price: float):
        """Executa ordem de venda simulada."""
        if not self.has_position():
            return

        revenue = self.crypto_held * price
        fee = revenue * 0.001
        revenue_after_fee = revenue - fee
        pnl = revenue_after_fee - (self.crypto_held * self.entry_price)
        pnl_pct = (pnl / (self.crypto_held * self.entry_price)) * 100

        self.balance += revenue_after_fee

        if pnl >= 0:
            self.wins += 1
            emoji = "💰"
        else:
            self.losses += 1
            emoji = "📉"

        logger.info(
            f"{emoji} VENDA | Preço: ${price:.4f} | "
            f"Revenue: ${revenue_after_fee:.2f} | P&L: ${pnl:.2f} ({pnl_pct:+.2f}%)"
        )

        self.trades.append({
            "type": "SELL",
            "price": price,
            "quantity": self.crypto_held,
            "pnl": pnl,
            "pnl_pct": pnl_pct,
            "time": datetime.now().isoformat(),
        })

        self.crypto_held = 0.0
        self.entry_price = 0.0

        # Guardar histórico
        self._save_trades()

    def check_sl_tp(self, current_price: float):
        """Verifica stop-loss e take-profit."""
        if not self.has_position():
            return

        change = (current_price - self.entry_price) / self.entry_price

        if change <= -self.config.STOP_LOSS_PCT:
            logger.warning(f"🛑 STOP-LOSS atingido ({change*100:.2f}%)")
            self.sell(current_price)

        elif change >= self.config.TAKE_PROFIT_PCT:
            logger.info(f"🎯 TAKE-PROFIT atingido ({change*100:.2f}%)")
            self.sell(current_price)

    def print_status(self, current_price: float):
        """Imprime estado atual da conta."""
        total_value = self.balance
        unrealized_pnl = 0.0

        if self.has_position():
            crypto_value = self.crypto_held * current_price
            total_value += crypto_value
            unrealized_pnl = crypto_value - (self.crypto_held * self.entry_price)

        total_return = ((total_value - self.config.INITIAL_BALANCE) / self.config.INITIAL_BALANCE) * 100

        logger.info(
            f"💼 Saldo: ${self.balance:.2f} USDT | "
            f"Total: ${total_value:.2f} | "
            f"Retorno: {total_return:+.2f}% | "
            f"Trades: {len([t for t in self.trades if t['type']=='SELL'])} | "
            f"W/L: {self.wins}/{self.losses}"
        )

        if self.has_position():
            logger.info(
                f"📊 Posição aberta | Entrada: ${self.entry_price:.4f} | "
                f"P&L não realizado: ${unrealized_pnl:+.2f}"
            )

    def print_summary(self):
        """Resumo final da sessão."""
        sells = [t for t in self.trades if t["type"] == "SELL"]
        total_pnl = sum(t.get("pnl", 0) for t in sells)
        win_rate = (self.wins / len(sells) * 100) if sells else 0

        logger.info("\n" + "=" * 50)
        logger.info("  RESUMO DA SESSÃO")
        logger.info("=" * 50)
        logger.info(f"  Trades realizados : {len(sells)}")
        logger.info(f"  Wins / Losses     : {self.wins} / {self.losses}")
        logger.info(f"  Win Rate          : {win_rate:.1f}%")
        logger.info(f"  P&L Total         : ${total_pnl:+.2f}")
        logger.info(f"  Saldo final       : ${self.balance:.2f}")
        logger.info("=" * 50)

    def _save_trades(self):
        """Guarda histórico de trades em JSON."""
        try:
            with open("logs/trades.json", "w") as f:
                json.dump(self.trades, f, indent=2)
        except Exception as e:
            logger.error(f"Erro ao guardar trades: {e}")
