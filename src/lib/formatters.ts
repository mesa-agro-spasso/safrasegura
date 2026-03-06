export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function formatUSD(value: number): string {
  return `US$ ${value.toFixed(2)}`;
}
