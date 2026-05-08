export type Platform = "polymarket" | "bayse";

export type TimeWindow = "15m" | "1h" | "4h";

export interface Market {
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
  updated_at: string;
}

export interface Snapshot {
  market_id: string;
  ts: string;
  probability: number;
  volume: number | null;
}

export interface Move {
  id: number;
  market_id: string;
  window: TimeWindow;
  prob_from: number;
  prob_to: number;
  delta: number;
  score: number;
  detected_at: string;
}

export interface SparklinePoint {
  ts: string;
  probability: number;
}

export interface FeedItem {
  market: Market;
  move: Pick<Move, "window" | "prob_from" | "prob_to" | "delta" | "score" | "detected_at">;
  sparkline: SparklinePoint[];
}

export interface AttributionEvent {
  ts: string;
  source: string;
  headline: string;
  url?: string;
}

export interface CategoryCount {
  name: string;
  count: number;
}

export interface FeedResponse {
  window: TimeWindow;
  count: number;
  categories: CategoryCount[];
  items: FeedItem[];
}
