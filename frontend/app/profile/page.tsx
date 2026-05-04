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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("kraken_api_key_enc")
        .eq("id", user.id)
        .single();
      setHasKeys(!!data?.kraken_api_key_enc);
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
        <div className="flex items-center gap-3">
          <div className="font-display font-700 text-sm tracking-widest uppercase text-cyan text-glow-cyan">AstraX</div>
          <div className="text-[10px] text-dim tracking-wide">Scalping Engine</div>
        </div>
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
