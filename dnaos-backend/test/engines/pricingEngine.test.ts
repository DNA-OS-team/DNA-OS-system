import { describe, expect, it } from "vitest";

import { calculatePricing } from "../../src/core/engines/pricingEngine.js";

describe("pricingEngine", () => {
  it("selects the lowest available supplier with enough stock", () => {
    const result = calculatePricing({
      items: [
        {
          id: "item-1",
          productVariantId: "variant-1",
          quantity: 10,
          unit: "คิว"
        }
      ],
      candidatesByVariant: {
        "variant-1": [
          {
            id: "supplier-product-expensive",
            supplierCompanyId: "supplier-1",
            productVariantId: "variant-1",
            price: 120,
            isAvailable: true,
            availableQty: 20
          },
          {
            id: "supplier-product-cheap",
            supplierCompanyId: "supplier-2",
            productVariantId: "variant-1",
            price: 100,
            isAvailable: true,
            availableQty: 20
          }
        ]
      }
    });

    expect(result.status).toBe("CALCULATED");
    expect(result.items[0]?.supplierProductId).toBe("supplier-product-cheap");
    expect(result.items[0]?.supplierTotalCost).toBe(1000);
    expect(result.items[0]?.sellTotalPrice).toBe(1150);
    expect(result.totalMargin).toBe(150);
  });

  it("marks pricing for review when stock is not enough", () => {
    const result = calculatePricing({
      items: [
        {
          id: "item-1",
          productVariantId: "variant-1",
          quantity: 30,
          unit: "คิว"
        }
      ],
      candidatesByVariant: {
        "variant-1": [
          {
            id: "supplier-product-1",
            supplierCompanyId: "supplier-1",
            productVariantId: "variant-1",
            price: 100,
            isAvailable: true,
            availableQty: 5
          }
        ]
      }
    });

    expect(result.status).toBe("NEEDS_REVIEW");
    expect(result.items[0]?.supplierProductId).toBeNull();
    expect(result.items[0]?.supplierCompanyId).toBeNull();
    expect(result.items[0]?.hasEnoughStock).toBe(false);
    expect(result.items[0]?.warning).toBe("stock ไม่พอต่อจำนวนที่สั่ง");
  });
});
