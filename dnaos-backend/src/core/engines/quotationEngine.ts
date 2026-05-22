const DEFAULT_VAT_RATE = 0.07;
const APPROVAL_MIN_MARGIN_PERCENT = 10;
const APPROVAL_MIN_AMOUNT = 500_000;

type QuotationSourceBoqItem = {
  customerOrderItemId: string;
  productVariantId: string;
  description: string | null;
  quantity: { toString: () => string };
  unit: string;
  sellUnitPrice: { toString: () => string };
  sellTotalPrice: { toString: () => string };
  marginPercent: { toString: () => string };
  sortOrder: number;
};

export type QuotationEngineInput = {
  boqItems: QuotationSourceBoqItem[];
  customerCreditStatus?: string | null;
};

export type QuotationItemResult = {
  customerOrderItemId: string;
  productVariantId: string;
  description: string | null;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
  sortOrder: number;
};

export type QuotationEngineResult = {
  subtotal: string;
  vatRate: string;
  vatAmount: string;
  totalAmount: string;
  requiresApproval: boolean;
  approvalReason: string | null;
  items: QuotationItemResult[];
};

export function calculateQuotation(input: QuotationEngineInput): QuotationEngineResult {
  const { boqItems, customerCreditStatus } = input;

  const items: QuotationItemResult[] = boqItems.map((item) => ({
    customerOrderItemId: item.customerOrderItemId,
    productVariantId: item.productVariantId,
    description: item.description,
    quantity: item.quantity.toString(),
    unit: item.unit,
    unitPrice: item.sellUnitPrice.toString(),
    totalPrice: item.sellTotalPrice.toString(),
    sortOrder: item.sortOrder,
  }));

  const subtotal = boqItems.reduce(
    (sum, item) => sum + Number(item.sellTotalPrice),
    0
  );
  const vatRate = DEFAULT_VAT_RATE;
  const vatAmount = subtotal * vatRate;
  const totalAmount = subtotal + vatAmount;

  const reasons: string[] = [];

  const allMargins = boqItems.map((item) => Number(item.marginPercent));
  const minMargin = allMargins.length > 0 ? Math.min(...allMargins) : 100;
  if (minMargin < APPROVAL_MIN_MARGIN_PERCENT) {
    reasons.push(`มี item ที่ margin ต่ำกว่า ${APPROVAL_MIN_MARGIN_PERCENT}% (ต่ำสุด ${minMargin.toFixed(2)}%)`);
  }

  if (totalAmount >= APPROVAL_MIN_AMOUNT) {
    reasons.push(`ยอดรวม ${totalAmount.toLocaleString("th-TH")} บาท เกินวงเงิน ${APPROVAL_MIN_AMOUNT.toLocaleString("th-TH")} บาท`);
  }

  if (customerCreditStatus === "HOLD" || customerCreditStatus === "BLOCKED") {
    reasons.push(`สถานะเครดิตลูกค้า: ${customerCreditStatus}`);
  }

  const requiresApproval = reasons.length > 0;

  return {
    subtotal: subtotal.toFixed(2),
    vatRate: vatRate.toFixed(4),
    vatAmount: vatAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    requiresApproval,
    approvalReason: requiresApproval ? reasons.join("; ") : null,
    items,
  };
}
