import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

export async function GET() {
  if (!BACKEND) return NextResponse.json({ _connected: false });
  try {
    const res = await fetch(`${BACKEND}/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return NextResponse.json({ _connected: false });
    const data = await res.json();
    return NextResponse.json({ ...data, _connected: true });
  } catch {
    return NextResponse.json({ _connected: false });
  }
}
