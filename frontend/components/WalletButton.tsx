"use client";

import { useConnectModal, useAccountModal } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";

export default function WalletButton() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { data: balance } = useBalance({ address });

  if (!isConnected || !address) {
    return (
      <button
        onClick={openConnectModal}
        className="px-3 py-1.5 rounded border border-cyan/30 bg-cyan/5 text-cyan text-[11px] font-mono font-600 tracking-wider uppercase hover:bg-cyan/10 hover:border-cyan/50 transition-all duration-200"
      >
        Conectar Wallet
      </button>
    );
  }

  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const eth = balance
    ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
    : "...";

  return (
    <button
      onClick={openAccountModal}
      className="flex items-center gap-2 px-3 py-1.5 rounded border border-cyan/20 bg-cyan/5 hover:bg-cyan/10 hover:border-cyan/40 transition-all duration-200"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-cyan" />
      <span className="text-[11px] font-mono text-cyan">{short}</span>
      <span className="text-[10px] text-dim font-mono hidden sm:inline">{eth}</span>
    </button>
  );
}
