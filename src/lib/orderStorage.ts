import { supabase } from "@/integrations/supabase/client";
import type { OrderRecord } from "./orderRecord";

// Map DB row to OrderRecord
function rowToRecord(row: any): OrderRecord {
  return {
    id: row.id,
    sequentialNumber: row.sequential_number,
    operationId: row.operation_id,
    commodity: row.commodity,
    exchange: row.exchange,
    warehouseId: row.warehouse_id,
    warehouseDisplayName: row.warehouse_display_name,
    volumeSacks: Number(row.volume_sacks),
    volumeTons: Number(row.volume_tons),
    volumeBushels: row.volume_bushels != null ? Number(row.volume_bushels) : null,
    originationPriceNetBrl: Number(row.origination_price_net_brl),
    originationPriceGrossBrl: Number(row.origination_price_gross_brl),
    futuresPrice: Number(row.futures_price),
    futuresPriceCurrency: row.futures_price_currency,
    exchangeRate: row.exchange_rate != null ? Number(row.exchange_rate) : null,
    targetBasisBrl: Number(row.target_basis_brl),
    purchasedBasisBrl: Number(row.purchased_basis_brl),
    breakEvenBasisBrl: Number(row.break_even_basis_brl),
    costs: row.costs as OrderRecord["costs"],
    ticker: row.ticker,
    expDate: row.exp_date,
    legs: row.legs as OrderRecord["legs"],
    broker: row.broker,
    brokerAccount: row.broker_account,
    brokeragePerContract: Number(row.brokerage_per_contract),
    brokerageCurrency: row.brokerage_currency,
    paymentDate: row.payment_date,
    saleDate: row.sale_date,
    orderMessage: row.order_message,
    confirmationMessage: row.confirmation_message,
    status: row.status,
    stonexConfirmationText: row.stonex_confirmation_text,
    stonexConfirmedAt: row.stonex_confirmed_at,
    generatedAt: row.generated_at,
    generatedByUserId: row.generated_by_user_id,
    notes: row.notes,
  };
}

// Map OrderRecord to DB insert
function recordToRow(record: OrderRecord) {
  return {
    id: record.id,
    sequential_number: record.sequentialNumber,
    operation_id: record.operationId,
    commodity: record.commodity,
    exchange: record.exchange,
    warehouse_id: record.warehouseId,
    warehouse_display_name: record.warehouseDisplayName,
    volume_sacks: record.volumeSacks,
    volume_tons: record.volumeTons,
    volume_bushels: record.volumeBushels,
    origination_price_net_brl: record.originationPriceNetBrl,
    origination_price_gross_brl: record.originationPriceGrossBrl,
    futures_price: record.futuresPrice,
    futures_price_currency: record.futuresPriceCurrency,
    exchange_rate: record.exchangeRate,
    target_basis_brl: record.targetBasisBrl,
    purchased_basis_brl: record.purchasedBasisBrl,
    break_even_basis_brl: record.breakEvenBasisBrl,
    costs: record.costs as any,
    ticker: record.ticker,
    exp_date: record.expDate,
    legs: record.legs as any,
    broker: record.broker,
    broker_account: record.brokerAccount,
    brokerage_per_contract: record.brokeragePerContract,
    brokerage_currency: record.brokerageCurrency,
    payment_date: record.paymentDate,
    sale_date: record.saleDate,
    order_message: record.orderMessage,
    confirmation_message: record.confirmationMessage,
    status: record.status,
    stonex_confirmation_text: record.stonexConfirmationText,
    stonex_confirmed_at: record.stonexConfirmedAt,
    generated_at: record.generatedAt,
    generated_by_user_id: record.generatedByUserId,
    notes: record.notes,
  };
}

export async function saveOrder(record: OrderRecord): Promise<void> {
  const { error } = await supabase.from("orders").insert(recordToRow(record));
  if (error) throw error;
}

export async function getAllOrders(): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("generated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToRecord);
}

export async function getOrderById(id: string): Promise<OrderRecord | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToRecord(data) : null;
}

export async function updateOrderStatus(id: string, status: OrderRecord["status"]): Promise<void> {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateStonexConfirmation(id: string, confirmationText: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({
      stonex_confirmation_text: confirmationText,
      stonex_confirmed_at: new Date().toISOString(),
      status: "BROKER_CONFIRMED",
    })
    .eq("id", id);
  if (error) throw error;
}

export async function getNextSequentialNumber(): Promise<number> {
  const { data, error } = await supabase
    .from("orders")
    .select("sequential_number")
    .order("sequential_number", { ascending: false })
    .limit(1);
  if (error) throw error;
  if (!data || data.length === 0) return 1;
  return data[0].sequential_number + 1;
}

export async function deleteOrder(id: string): Promise<void> {
  await updateOrderStatus(id, "CANCELLED");
}

export async function updateOrderNotes(id: string, notes: string): Promise<void> {
  const { error } = await supabase.from("orders").update({ notes }).eq("id", id);
  if (error) throw error;
}

export async function permanentlyDeleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}

export async function exportOrdersToJson(): Promise<string> {
  const orders = await getAllOrders();
  return JSON.stringify(orders, null, 2);
}
