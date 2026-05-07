import { NextResponse } from "next/server";
import { supabaseServer, hasSupabase } from "@/lib/supabase/server";
import { stubAttribution } from "@/lib/attribution/stub";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!hasSupabase()) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 503 });
  }
  const db = supabaseServer();

  const { data: market, error } = await db
    .from("markets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!market) return NextResponse.json({ error: "not found" }, { status: 404 });

  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: snapshots } = await db
    .from("snapshots")
    .select("ts, probability")
    .eq("market_id", id)
    .gte("ts", since)
    .order("ts", { ascending: true });

  const attribution = stubAttribution(id, new Date().toISOString());

  return NextResponse.json({
    market,
    snapshots: (snapshots ?? []).map((s) => ({ ts: s.ts, probability: Number(s.probability) })),
    attribution,
  });
}
