"""
PaperTrader - Simulador de ordens para paper trading
Regista todas as operações e calcula P&L real (com fees corretas).
"""

import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class PaperTrader:
    def __init__(self, config):
        self.config = config
        self.balance = config.INITIAL_BALANCE
        self.crypto_held  = 0.0
        self.entry_price  = 0.0
        self.entry_cost   = 0.0   # FIX: custo real de entrada (com fee)
        self.trades = []
        self.wins   = 0
        self.losses = 0

        # FIX: usar a fee real da Kraken (taker)
        # Se usares limit orders (maker), muda para 0.0016
        self.FEE = getattr(config, "FEE_PCT", 0.0026)

    def has_position(self) -> bool:
        return self.crypto_held > 0

    def buy(self, price: float):
        """Executa ordem de compra simulada com fee real."""
        amount_usdt = self.balance * self.config.TRADE_PERCENT
        if amount_usdt < 5:
            logger.warning("Saldo insuficiente para comprar.")
            return

        # FIX: fee Kraken taker (0.26%)
        fee             = amount_usdt * self.FEE
        amount_net      = amount_usdt - fee
        quantity        = amount_net / price

        self.crypto_held = quantity
        self.entry_price = price
        self.entry_cost  = amount_usdt  # FIX: guarda custo total (com fee)
        self.balance    -= amount_usdt

        logger.info(
            f"🟢 COMPRA | Preço: ${price:.4f} | "
            f"Qty: {quantity:.6f} | Custo: ${amount_usdt:.2f} | "
            f"Fee: ${fee:.4f} ({self.FEE*100:.2f}%)"
        )

        self.trades.append({
            "type":     "BUY",
            "price":    price,
            "quantity": quantity,
            "cost":     amount_usdt,
            "fee":      fee,
            "time":     datetime.now().isoformat(),
        })

    def sell(self, price: float, reason: str = "SIGNAL"):
        """Executa ordem de venda simulada com fee real."""
        if not self.has_position():
            return

        revenue_gross    = self.crypto_held * price
        fee_sell         = revenue_gross * self.FEE
        revenue_net      = revenue_gross - fee_sell

        # FIX: P&L real = receita líquida - custo total de entrada (já inclui fee de compra)
        pnl     = revenue_net - self.entry_cost
        pnl_pct = (pnl / self.entry_cost) * 100

        self.balance += revenue_net

        if pnl >= 0:
            self.wins += 1
            emoji = "💰"
        else:
            self.losses += 1
            emoji = "📉"

        logger.info(
            f"{emoji} VENDA [{reason}] | Preço: ${price:.4f} | "
            f"Revenue: ${revenue_net:.2f} | P&L: ${pnl:+.2f} ({pnl_pct:+.2f}%) | "
            f"Fee venda: ${fee_sell:.4f}"
        )

        self.trades.append({
            "type":     "SELL",
            "reason":   reason,   # SIGNAL | STOP_LOSS | TAKE_PROFIT
            "price":    price,
            "quantity": self.crypto_held,
            "revenue":  revenue_net,
            "fee":      fee_sell,
            "pnl":      pnl,
            "pnl_pct":  pnl_pct,
            "time":     datetime.now().isoformat(),
        })

        self.crypto_held = 0.0
        self.entry_price = 0.0
        self.entry_cost  = 0.0
        self._save_trades()

    def check_sl_tp(self, current_price: float):
        """
        Verifica SL/TP com base no P&L REAL (inclui fees de ambos os lados).
        FIX: antes comparava apenas variação de preço, ignorando fees.
        """
        if not self.has_position():
            return

        # Simula receita se vendesse agora
        revenue_if_sold = self.crypto_held * current_price * (1 - self.FEE)
        pnl_real_pct    = (revenue_if_sold - self.entry_cost) / self.entry_cost

        if pnl_real_pct <= -self.config.STOP_LOSS_PCT:
            logger.warning(
                f"🛑 STOP-LOSS | P&L real: {pnl_real_pct*100:.2f}% "
                f"(inclui fees de {self.FEE*100:.2f}% entrada+saída)"
            )
            self.sell(current_price, reason="STOP_LOSS")

        elif pnl_real_pct >= self.config.TAKE_PROFIT_PCT:
            logger.info(
                f"🎯 TAKE-PROFIT | P&L real: {pnl_real_pct*100:.2f}%"
            )
            self.sell(current_price, reason="TAKE_PROFIT")

    def print_status(self, current_price: float):
        total_value