import type { OrderRecord } from "./orderRecord";

const STORAGE_KEY = "spasso_order_history";

function readAll(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OrderRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: OrderRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function saveOrder(record: OrderRecord): void {
  const all = readAll();
  all.push(record);
  writeAll(all);
}

export function getAllOrders(): OrderRecord[] {
  return readAll().sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  );
}

export function getOrderById(id: string): OrderRecord | null {
  return readAll().find((r) => r.id === id) ?? null;
}

export function updateOrderStatus(id: string, status: OrderRecord["status"]): void {
  const all = readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx >= 0) {
    all[idx].status = status;
    writeAll(all);
  }
}

export function updateStonexConfirmation(id: string, confirmationText: string): void {
  const all = readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx >= 0) {
    all[idx].stonexConfirmationText = confirmationText;
    all[idx].stonexConfirmedAt = new Date().toISOString();
    all[idx].status = "BROKER_CONFIRMED";
    writeAll(all);
  }
}

export function getNextSequentialNumber(): number {
  const all = readAll();
  if (all.length === 0) return 1;
  return Math.max(...all.map((r) => r.sequentialNumber)) + 1;
}

export function deleteOrder(id: string): void {
  updateOrderStatus(id, "CANCELLED");
}

export function exportOrdersToJson(): string {
  return JSON.stringify(getAllOrders(), null, 2);
}
