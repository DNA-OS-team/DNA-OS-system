export type BoqEngineItemInput = {
  customerOrderItemId: string;
  productVariantId: string;
  description?: string | null;
  quantity: number;
  unit: string;
  supplierUnitCost: number;
  supplierTotalCost: number;
  sellUnitPrice: number;
  sellTotalPrice: number;
  marginAmount: number;
  marginPercent: number;
  sortOrder?: number;
};

export type BoqEngineInput = {
  items: BoqEngineItemInput[];
  vatRate?: number;
};

export type BoqEngineItemResult = {
  customerOrderItemId: string;
  productVariantId: string;
  description: string | null;
  quantity: number;
  unit: string;
  supplierUnitCost: number;
  supplierTotalCost: number;
  sellUnitPrice: number;
  sellTotalPrice: number;
  marginAmount: number;
  marginPercent: number;
  sortOrder: number;
};

export type BoqEngineResult = {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  items: BoqEngineItemResult[];
};

const DEFAULT_VAT_RATE = 0.07;

export function calculateBoq(input: BoqEngineInput): BoqEngineResult {
  const vatRate = input.vatRate ?? DEFAULT_VAT_RATE;

  const items: BoqEngineItemResult[] = input.items.map((item, index) => ({
    customerOrderItemId: item.customerOrderItemId,
    productVariantId: item.productVariantId,
    description: item.description ?? null,
    quantity: item.quantity,
    unit: item.unit,
    supplierUnitCost: roundMoney(item.supplierUnitCost),
    supplierTotalCost: roundMoney(item.supplierTotalCost),
    sellUnitPrice: roundMoney(item.sellUnitPrice),
    sellTotalPrice: roundMoney(item.sellTotalPrice),
    marginAmount: roundMoney(item.marginAmount),
    marginPercent: roundPercent(item.marginPercent),
    sortOrder: item.sortOrder ?? index
  }));

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.sellTotalPrice, 0));
  const vatAmount = roundMoney(subtotal * vatRate);
  const totalAmount = roundMoney(subtotal + vatAmount);

  return { subtotal, vatRate, vatAmount, totalAmount, items };
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
