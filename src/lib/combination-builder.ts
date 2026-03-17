// combination-builder.ts
// Merges global parameters with per-combination overrides to build
// the payload for the run-custom-pricing Edge Function.

// ── Types ─────────────────────────────────────────────────────────────────

export interface SharedParams {
  interest_rate: number;
  interest_rate_period: string;
  storage_cost: number;
  storage_cost_type: string;
  reception_cost: number;
  desk_cost_pct: number;
}

export interface CommodityParams {
  brokerage_per_contract: number;
  shrinkage_rate_monthly: number;
  rounding_increment: number;
  risk_free_rate: number;
  sigma: number;
  option_type: string;
}

export interface GlobalParams {
  shared: SharedParams;
  soybean: CommodityParams;
  corn: CommodityParams;
}

export interface CombinationRow {
  id: string;
  commodity: "soybean" | "corn";
  display_name: string;
  warehouse_id: string;
  ticker: string;
  futures_price: number;
  exp_date: string;
  exchange_rate?: number | null;
  payment_date: string;
  grain_reception_date?: string;
  sale_date: string;
  target_basis: number;
  additional_discount_brl: number;
  // Overrides (undefined = inherit from global)
  overrides?: Partial<SharedParams & CommodityParams>;
}

export interface CombinationPayload {
  warehouse_id: string;
  display_name: string;
  commodity: "soybean" | "corn";
  payment_date: string;
  grain_reception_date?: string;
  sale_date: string;
  target_basis: number;
  ticker: string;
  exp_date: string;
  futures_price: number;
  exchange_rate?: number;
  additional_discount_brl: number;
  interest_rate: number;
  interest_rate_period: string;
  storage_cost: number;
  storage_cost_type: string;
  reception_cost: number;
  brokerage_per_contract: number;
  desk_cost_pct: number;
  shrinkage_rate_monthly: number;
  rounding_increment: number;
  risk_free_rate: number;
  sigma: number;
  option_type: string;
}

// ── Default Values (1:1 with notebook) ───────────────────────────────────

export const DEFAULT_SHARED: SharedParams = {
  interest_rate: 1.4,
  interest_rate_period: "monthly",
  storage_cost: 3.5,
  storage_cost_type: "fixed",
  reception_cost: 0.0,
  desk_cost_pct: 0.003,
};

export const DEFAULT_SOYBEAN: CommodityParams = {
  brokerage_per_contract: 15.0,
  shrinkage_rate_monthly: 0.0,
  rounding_increment: 0.50,
  risk_free_rate: 0.149,
  sigma: 0.35,
  option_type: "call",
};

export const DEFAULT_CORN: CommodityParams = {
  brokerage_per_contract: 12.0,
  shrinkage_rate_monthly: 0.003,
  rounding_increment: 0.25,
  risk_free_rate: 0.149,
  sigma: 0.35,
  option_type: "call",
};

// ── Builder ──────────────────────────────────────────────────────────────

export function buildCombinationPayloads(
  globals: GlobalParams,
  combinations: CombinationRow[],
): CombinationPayload[] {
  return combinations.map((combo) => {
    const commodityParams = combo.commodity === "soybean" ? globals.soybean : globals.corn;
    const merged = {
      ...globals.shared,
      ...commodityParams,
      ...combo.overrides,
    };

    return {
      warehouse_id: combo.warehouse_id,
      display_name: combo.display_name,
      commodity: combo.commodity,
      payment_date: combo.payment_date,
      grain_reception_date: combo.grain_reception_date,
      sale_date: combo.sale_date,
      target_basis: combo.target_basis,
      ticker: combo.ticker,
      exp_date: combo.exp_date,
      futures_price: combo.futures_price,
      exchange_rate: combo.exchange_rate ?? undefined,
      additional_discount_brl: combo.additional_discount_brl,
      interest_rate: merged.interest_rate,
      interest_rate_period: merged.interest_rate_period,
      storage_cost: merged.storage_cost,
      storage_cost_type: merged.storage_cost_type,
      reception_cost: merged.reception_cost,
      brokerage_per_contract: merged.brokerage_per_contract,
      desk_cost_pct: merged.desk_cost_pct,
      shrinkage_rate_monthly: merged.shrinkage_rate_monthly,
      rounding_increment: merged.rounding_increment,
      risk_free_rate: merged.risk_free_rate,
      sigma: merged.sigma,
      option_type: merged.option_type,
    };
  });
}
