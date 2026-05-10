"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [hasKeys, setHasKeys] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "done">("idle");
  const [loading, setLoading] = useState(true);

  const [wallet, setWallet] = useState<{ address: string; network: string } | null>(null);
  const [walletInput, setWalletInput] = useState("");
  const [walletNetwork, setWalletNetwork] = useState("ERC20");
  const [walletStatus, setWalletStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [walletError, setWalletError] = useState("");
  const [walletDeleteStatus, setWalletDeleteStatus] = useState<"idle" | "deleting" | "done">("idle");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("kraken_api_key_enc, commission_wallet, commission_wallet_network")
        .eq("id", user.id)
        .single();
      setHasKeys(!!data?.kraken_api_key_enc);
      if (data?.commission_wallet) {
        setWallet({ address: data.commission_wallet, network: data.commission_wallet_network ?? "ERC20" });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveKeys(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");
    const res = await fetch("/api/profile/kraken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
    });
    if (res.ok) {
      setSaveStatus("saved");
      setHasKeys(true);
      setApiKey("");
      setApiSecret("");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setSaveStatus("error");
    }
  }

  async function handleDeleteKeys() {
    setDeleteStatus("deleting");
    const res = await fetch("/api/profile/kraken", { method: "DELETE" });
    if (res.ok) {
      setHasKeys(false);
      setDeleteStatus("done");
      setTimeout(() => setDeleteStatus("idle"), 2000);
    }
  }

  async function handleSaveWallet(e: React.FormEvent) {
    e.preventDefault();
    setWalletStatus("saving");
    setWalletError("");
    const res = await fetch("/api/profile/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: walletInput, network: walletNetwork }),
    });
    if (res.ok) {
      setWallet({ address: walletInput, network: walletNetwork });
      setWalletInput("");
      setWalletStatus("saved");
      setTimeout(() => setWalletStatus("idle"), 3000);
    } else {
      const { error } = await res.json();
      setWalletError(error ?? "Erro ao guardar.");
      setWalletStatus("error");
    }
  }

  async function handleDeleteWallet() {
    setWalletDeleteStatus("deleting");
    const res = await fetch("/api/profile/wallet", { method: "DELETE" });
    if (res.ok) {
      setWallet(null);
      setWalletDeleteStatus("done");
      setTimeout(() => setWalletDeleteStatus("idle"), 2000);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-dim text-xs font-mono animate-pulse">A carregar...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="border-b border-border/60 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10"
        style={{ background: "rgba(9,11,15,0.92)", backdropFilter: "blur(16px)" }}
      >
        <Link href="https://astraxcoin.com" target="_blank" className="flex items-center gap-3">
            <img src="/favicon.ico" alt="Logo" className="w-6 h-6" />
            <div className="font-display font-700 text-sm tracking-widest uppercase text-cyan text-glow-cyan">AstraX</div>
          <div className="text-[12px] text-dim tracking-wide">Auto Trader (v2)</div>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[11px] font-mono text-dim hover:text-text transition-colors">
            ← Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded border border-red/30 bg-red/5 text-red text-[11px] font-mono tracking-wider uppercase hover:bg-red/10 transition-all"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-5">
        <h1 className="text-sm font-mono font-600 text-text tracking-widest uppercase">Perfil</h1>

        {/* Account info */}
        <div className="card-border rounded-lg p-5">
          <div className="text-[10px] text-dim uppercase tracking-[0.15em] mb-3">Conta</div>
          <div className="text-sm font-mono text-text">{email}</div>
        </div>

        {/* Kraken API Keys */}
        <div className="card-border rounded-lg p-5">
          <div className="text-[10px] text-dim uppercase tracking-[0.15em] mb-1">Kraken API Keys</div>
          <div className="text-[11px] text-dim font-mono mb-4">
            Necessárias para o modo Live. As chaves são encriptadas com AES-256-GCM antes de serem guardadas.
          </div>

          {hasKeys ? (
            <div className="flex items-center justify-between p-3 rounded border border-green/20 bg-green/5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green" />
                <span className="text-[11px] font-mono text-green">Chaves configuradas</span>
              </div>
              <button
                onClick={handleDeleteKeys}
                disabled={deleteStatus === "deleting"}
                className="text-[10px] font-mono text-red/70 hover:text-red border border-red/20 hover:border-red/40 px-2 py-1 rounded transition-all disabled:opacity-50"
              >
                {deleteStatus === "deleting" ? "A remover..." : deleteStatus === "done" ? "Removido" : "Remover"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveKeys} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-dim uppercase tracking-[0.15em] block mb-1">API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-xs font-mono text-text placeholder:text-dim/40 focus:outline-none focus:border-cyan/50 transition-colors"
                  placeholder="Kraken API Key"
                />
              </div>
              <div>
                <label className="text-[10px] text-dim uppercase tracking-[0.15em] block mb-1">API Secret</label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  required
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-xs font-mono text-text placeholder:text-dim/40 focus:outline-none focus:border-cyan/50 transition-colors"
                  placeholder="Kraken API Secret"
                />
              </div>
              {saveStatus === "error" && (
                <div className="text-[11px] font-mono text-red border border-red/30 bg-red/5 rounded px-3 py-2">
                  Erro ao guardar. Tenta novamente.
                </div>
              )}
              <button
                type="submit"
                disabled={saveStatus === "saving"}
                className="py-2 rounded border border-cyan/40 bg-cyan/10 text-cyan text-[11px] font-mono font-600 tracking-widest uppercase hover:bg-cyan/20 hover:border-cyan/60 transition-all disabled:opacity-50"
              >
                {saveStatus === "saving" ? "A guardar..." : saveStatus === "saved" ? "Guardado!" : "Guardar Chaves"}
              </button>
            </form>
          )}
        </div>

        {/* Commission Wallet */}
        <div className="card-border rounded-lg p-5">
          <div className="text-[10px] text-dim uppercase tracking-[0.15em] mb-1">Carteira de Comissão</div>
          <div className="text-[11px] text-dim font-mono mb-4">
            Endereço crypto para débito automático da comissão de <span className="text-yellow">1%</span> por trade no modo Live.
          </div>

          {wallet ? (
            <div className="flex items-center justify-between p-3 rounded border border-cyan/20 bg-cyan/5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan" />
                  <span className="text-[10px] font-mono text-dim uppercase tracking-wider">{wallet.network}</span>
                </div>
                <span className="text-[11px] font-mono text-text">
                  {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
                </span>
              </div>
              <button
                onClick={handleDeleteWallet}
                disabled={walletDeleteStatus === "deleting"}
                className="text-[10px] font-mono text-red/70 hover:text-red border border-red/20 hover:border-red/40 px-2 py-1 rounded transition-all disabled:opacity-50"
              >
                {walletDeleteStatus === "deleting" ? "A remover..." : walletDeleteStatus === "done" ? "Removido" : "Remover"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveWallet} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-dim uppercase tracking-[0.15em] block mb-1">Rede</label>
                <select
                  value={walletNetwork}
                  onChange={(e) => setWalletNetwork(e.target.value)}
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-xs font-mono text-text focus:outline-none focus:border-cyan/50 transition-colors"
                >
                  <option value="ERC20">ERC-20 (Ethereum / USDT)</option>
                  <option value="TRC20">TRC-20 (Tron / USDT)</option>
                  <option value="BTC">BTC (Bitcoin)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-dim uppercase tracking-[0.15em] block mb-1">Endereço</label>
                <input
                  type="text"
                  value={walletInput}
                  onChange={(e) => { setWalletInput(e.target.value); setWalletStatus("idle"); setWalletError(""); }}
                  required
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-xs font-mono text-text placeholder:text-dim/40 focus:outline-none focus:border-cyan/50 transition-colors"
                  placeholder={walletNetwork === "ERC20" ? "0x..." : walletNetwork === "TRC20" ? "T..." : "bc1... / 1... / 3..."}
                />
              </div>
              {walletStatus === "error" && (
                <div className="text-[11px] font-mono text-red border border-red/30 bg-red/5 rounded px-3 py-2">
                  {walletError}
                </div>
              )}
              <button
                type="submit"
                disabled={walletStatus === "saving"}
                className="py-2 rounded border border-cyan/40 bg-cyan/10 text-cyan text-[11px] font-mono font-600 tracking-widest uppercase hover:bg-cyan/20 hover:border-cyan/60 transition-all disabled:opacity-50"
              >
                {walletStatus === "saving" ? "A guardar..." : walletStatus === "saved" ? "Guardado!" : "Guardar Carteira"}
              </button>
            </form>
          )}
        </div>

        {/* Fee notice */}
        <div className="card-border rounded-lg p-4 border-l-2 border-l-yellow/40">
          <div className="text-[10px] text-dim uppercase tracking-[0.15em] mb-1">Comissão de Plataforma</div>
          <div className="text-[11px] text-dim font-mono">
            É cobrada uma comissão de <span className="text-yellow">1%</span> por cada trade executado no modo Live.
          </div>
        </div>
      </main>
    </div>
  );
}
