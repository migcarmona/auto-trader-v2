import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PATTERNS: Record<string, RegExp> = {
  ERC20: /^0x[0-9a-fA-F]{40}$/,
  TRC20: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  BTC:   /^(1|3)[1-9A-HJ-NP-Za-km-z]{25,34}$|^bc1[0-9a-z]{39,59}$/,
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { address, network } = await request.json();

  if (!address || !network) {
    return NextResponse.json({ error: "address and network required" }, { status: 400 });
  }

  if (!PATTERNS[network]) {
    return NextResponse.json({ error: "Rede inválida" }, { status: 400 });
  }

  if (!PATTERNS[network].test(address.trim())) {
    return NextResponse.json({ error: "Endereço inválido para a rede selecionada" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      commission_wallet: address.trim(),
      commission_wallet_network: network,
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("profiles")
    .update({ commission_wallet: null, commission_wallet_network: null })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
