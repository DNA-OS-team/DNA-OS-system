export type PricingOrderItemInput = {
  id: string;
  productVariantId: string;
  quantity: number;
  unit: string;
};

export type PricingSupplierCandidateInput = {
  id: string;
  supplierCompanyId: string;
  productVariantId: string;
  price: number;
  isAvailable: boolean;
  availableQty: number;
};

export type PricingEngineInput = {
  items: PricingOrderItemInput[];
  candidatesByVariant: Record<string, PricingSupplierCandidateInput[]>;
  markupRate?: number;
};

export type PricingEngineItemResult = {
  customerOrderItemId: string;
  productVariantId: string;
  supplierProductId: string | null;
  supplierCompanyId: string | null;
  quantity: number;
  unit: string;
  supplierUnitCost: number;
  supplierTotalCost: number;
  sellUnitPrice: number;
  sellTotalPrice: number;
  marginAmount: number;
  marginPercent: number;
  isAvailable: boolean;
  hasEnoughStock: boolean;
  warning: string | null;
};

export type PricingEngineResult = {
  status: "CALCULATED" | "NEEDS_REVIEW";
  totalSupplierCost: number;
  totalSellPrice: number;
  totalMargin: number;
  marginPercent: number;
  items: PricingEngineItemResult[];
};

const DEFAULT_MARKUP_RATE = 0.15;

export function calculatePricing(input: PricingEngineInput): PricingEngineResult {
  const markupRate = input.markupRate ?? DEFAULT_MARKUP_RATE;
  const items = input.items.map((item) => {
    const candidates = [...(input.candidatesByVariant[item.productVariantId] ?? [])].sort(
      (left, right) => left.price - right.price
    );
    const selected =
      candidates.find(
        (candidate) =>
          candidate.isAvailable && candidate.availableQty >= item.quantity
      ) ??
      candidates[0] ??
      null;

    const isAvailable = Boolean(selected?.isAvailable);
    const hasEnoughStock = Boolean(selected && selected.availableQty >= item.quantity);
    const supplierUnitCost = selected ? roundMoney(selected.price) : 0;
    const supplierTotalCost = roundMoney(supplierUnitCost * item.quantity);
    const sellUnitPrice = roundMoney(supplierUnitCost * (1 + markupRate));
    const sellTotalPrice = roundMoney(sellUnitPrice * item.quantity);
    const marginAmount = roundMoney(sellTotalPrice - supplierTotalCost);
    const marginPercent =
      sellTotalPrice > 0 ? roundPercent((marginAmount / sellTotalPrice) * 100) : 0;

    return {
      customerOrderItemId: item.id,
      productVariantId: item.productVariantId,
      supplierProductId: selected?.id ?? null,
      supplierCompanyId: selected?.supplierCompanyId ?? null,
      quantity: item.quantity,
      unit: item.unit,
      supplierUnitCost,
      supplierTotalCost,
      sellUnitPrice,
      sellTotalPrice,
      marginAmount,
      marginPercent,
      isAvailable,
      hasEnoughStock,
      warning: getPricingWarning(selected, item.quantity)
    };
  });

  const totalSupplierCost = roundMoney(
    items.reduce((sum, item) => sum + item.supplierTotalCost, 0)
  );
  const totalSellPrice = roundMoney(
    items.reduce((sum, item) => sum + item.sellTotalPrice, 0)
  );
  const totalMargin = roundMoney(totalSellPrice - totalSupplierCost);
  const marginPercent =
    totalSellPrice > 0 ? roundPercent((totalMargin / totalSellPrice) * 100) : 0;

  return {
    status: items.some((item) => item.warning) ? "NEEDS_REVIEW" : "CALCULATED",
    totalSupplierCost,
    totalSellPrice,
    totalMargin,
    marginPercent,
    items
  };
}

function getPricingWarning(
  candidate: PricingSupplierCandidateInput | null,
  quantity: number
) {
  if (!candidate) {
    return "ไม่พบ supplier product สำหรับสินค้านี้";
  }

  if (!candidate.isAvailable) {
    return "supplier product ยังไม่พร้อมขาย";
  }

  if (candidate.availableQty < quantity) {
    return "stock ไม่พอต่อจำนวนที่สั่ง";
  }

  return null;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
