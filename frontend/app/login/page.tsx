"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display font-700 text-2xl tracking-widest uppercase text-cyan text-glow-cyan">Auto Trader</div>
          <div className="text-[11px] text-dim tracking-[0.2em] uppercase mt-1">AstraX Scalping Engine</div>
        </div>

        <div className="card-border rounded-lg p-6">
          <h1 className="text-sm font-mono font-600 text-text tracking-widest uppercase mb-5">Entrar</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] text-dim uppercase tracking-[0.15em] block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm font-mono text-text placeholder:text-dim/40 focus:outline-none focus:border-cyan/50 transition-colors"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="text-[10px] text-dim uppercase tracking-[0.15em] block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm font-mono text-text placeholder:text-dim/40 focus:outline-none focus:border-cyan/50 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-[11px] font-mono text-red border border-red/30 bg-red/5 rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-2 rounded border border-cyan/40 bg-cyan/10 text-cyan text-[11px] font-mono font-600 tracking-widest uppercase hover:bg-cyan/20 hover:border-cyan/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "A entrar..." : "Entrar"}
            </button>
          </form>

          <div className="mt-4 text-center text-[11px] text-dim font-mono">
            Não tens conta?{" "}
            <Link href="/register" className="text-cyan hover:underline">
              Registar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
