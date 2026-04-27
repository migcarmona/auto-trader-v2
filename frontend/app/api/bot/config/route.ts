import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL;

export async function POST(req: NextRequest) {
  if (!BACKEND) return NextResponse.json({ status: "offline" });
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2000),
    });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ status: "offline" });
  }
}
