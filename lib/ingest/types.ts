import type { Platform } from "@/types";

export interface NormalizedMarket {
  id: string;
  platform: Platform;
  native_id: string;
  title: string;
  url: string;
  category: string | null;
  liquidity: number | null;
  volume: number | null;
  probability: number | null;
  closes_at: string | null;
}

export interface IngestResult {
  platform: Platform;
  fetched: number;
  upserted: number;
  skipped: number;
  error?: string;
}
