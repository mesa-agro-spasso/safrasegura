// params-storage.ts
// Persistence layer for Daily Table parameters (market data, global params, combinations).
// Uses a single-row table `daily_table_params` with JSONB columns.

import { supabase } from "@/integrations/supabase/client";
import type { MarketData } from "./market-service";
import type { GlobalParams } from "./combination-builder";
import type { CombinationGridRow } from "@/components/daily-table/CombinationsGrid";

export interface SavedParams {
  market_data: MarketData;
  global_params: GlobalParams;
  combinations: CombinationGridRow[];
  saved_at: string | null;
  generated_at: string | null;
}

const ROW_ID = "default";

export async function loadSavedParams(): Promise<SavedParams | null> {
  const { data, error } = await supabase
    .from("daily_table_params")
    .select("*")
    .eq("id", ROW_ID)
    .single();

  if (error || !data) return null;

  return {
    market_data: (data.market_data as any) ?? null,
    global_params: (data.global_params as any) ?? null,
    combinations: ((data.combinations as any) ?? []) as CombinationGridRow[],
    saved_at: data.saved_at,
    generated_at: data.generated_at,
  };
}

export async function saveParams(params: {
  market_data: MarketData;
  global_params: GlobalParams;
  combinations: CombinationGridRow[];
}): Promise<void> {
  const { error } = await supabase
    .from("daily_table_params")
    .update({
      market_data: params.market_data as any,
      global_params: params.global_params as any,
      combinations: params.combinations as any,
      saved_at: new Date().toISOString(),
    })
    .eq("id", ROW_ID);

  if (error) throw new Error(error.message);
}

export async function markGenerated(): Promise<void> {
  const { error } = await supabase
    .from("daily_table_params")
    .update({ generated_at: new Date().toISOString() })
    .eq("id", ROW_ID);

  if (error) throw new Error(error.message);
}
