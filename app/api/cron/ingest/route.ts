import { NextResponse } from "next/server";
import { fetchPolymarket } from "@/lib/ingest/polymarket";
import { fetchBayse } from "@/lib/ingest/bayse";
import { fetchKalshi } from "@/lib/ingest/kalshi";
import { supabaseServer } from "@/lib/supabase/server";
import { requireCronAuth } from "@/lib/auth";
import type { NormalizedMarket } from "@/lib/ingest/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function ingestSource(name: string, fetcher: () => Promise<NormalizedMarket[]>) {
  try {
    const items = await fetcher();
    return { name, items, error: null as string | null };
  } catch (e) {
    return { name, items: [] as NormalizedMarket[], error: String(e) };
  }
}

export async function POST(req: Request) {
  const guard = requireCronAuth(req);
  if (guard) return guard;

  const [poly, bayse, kalshi] = await Promise.all([
    ingestSource("polymarket", fetchPolymarket),
    ingestSource("bayse", fetchBayse),
    ingestSource("kalshi", fetchKalshi),
  ]);

  const sources = [poly, bayse, kalshi];
  const all = [...poly.items, ...bayse.items, ...kalshi.items];
  if (all.length === 0) {
    return NextResponse.json({ ok: true, ingested: 0, sources: sources.map((s) => ({ name: s.name, count: s.items.length, error: s.error })) });
  }

  const db = supabaseServer();
  const ts = new Date().toISOString();

  const { error: marketErr } = await db.from("markets").upsert(
    all.map((m) => ({
      id: m.id,
      platform: m.platform,
      native_id: m.native_id,
      title: m.title,
      url: m.url,
      image_url: m.image_url,
      category: m.category,
      liquidity: m.liquidity,
      volume: m.volume,
      probability: m.probability,
      closes_at: m.closes_at,
      updated_at: ts,
    })),
    { onConflict: "id" },
  );

  const snaps = all
    .filter((m) => m.probability != null)
    .map((m) => ({ market_id: m.id, ts, probability: m.probability!, volume: m.volume }));

  const { error: snapErr } = await db.from("snapshots").upsert(snaps, { onConflict: "market_id,ts" });

  return NextResponse.json({
    ok: !marketErr && !snapErr,
    ingested: all.length,
    snapshots: snaps.length,
    errors: { markets: marketErr?.message, snapshots: snapErr?.message },
    sources: sources.map((s) => ({ name: s.name, count: s.items.length, error: s.error })),
  });
}

export async function GET(req: Request) {
  return POST(req);
}
