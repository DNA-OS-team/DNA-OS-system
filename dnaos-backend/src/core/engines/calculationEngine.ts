export type MoneyLine = {
  quantity: number;
  unitPrice: number;
};

export function calculateSubtotal(lines: MoneyLine[]) {
  return lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);
}
