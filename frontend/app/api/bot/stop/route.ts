import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

export async function POST() {
  if (!BACKEND) return NextResponse.json({ status: "offline" });
  try {
    const res = await fetch(`${BACKEND}/stop`, { method: "POST", signal: AbortSignal.timeout(2000) });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ status: "offline" });
  }
}
