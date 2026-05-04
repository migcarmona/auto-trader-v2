import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { api_key, api_secret } = await request.json();
  if (!api_key || !api_secret) {
    return NextResponse.json({ error: "api_key and api_secret required" }, { status: 400 });
  }

  const [encKey, encSecret] = await Promise.all([encrypt(api_key), encrypt(api_secret)]);

  const { error } = await supabase
    .from("profiles")
    .update({ kraken_api_key_enc: encKey, kraken_api_secret_enc: encSecret })
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
    .update({ kraken_api_key_enc: null, kraken_api_secret_enc: null })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
