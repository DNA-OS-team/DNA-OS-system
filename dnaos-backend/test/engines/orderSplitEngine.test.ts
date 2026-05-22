import { describe, expect, it } from "vitest";

import {
  groupItemsBySupplier,
  splitOrderBySupplier,
  validateAllItemsHaveSupplier,
  type SupplierSplitItemInput
} from "../../src/core/engines/orderSplitEngine.js";

const baseItem: SupplierSplitItemInput = {
  customerOrderItemId: "order-item-1",
  productVariantId: "variant-1",
  supplierCompanyId: "supplier-1",
  supplierProductId: "supplier-product-1",
  description: null,
  quantity: 10,
  unit: "คิว",
  unitCost: 100,
  totalCost: 1000,
  sortOrder: 0
};

describe("orderSplitEngine", () => {
  it("groups one supplier", () => {
    const groups = splitOrderBySupplier([baseItem]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.supplierCompanyId).toBe("supplier-1");
    expect(groups[0]?.items).toHaveLength(1);
  });

  it("groups two suppliers", () => {
    const groups = groupItemsBySupplier([
      baseItem,
      {
        ...baseItem,
        customerOrderItemId: "order-item-2",
        supplierCompanyId: "supplier-2",
        supplierProductId: "supplier-product-2"
      }
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.supplierCompanyId)).toEqual([
      "supplier-1",
      "supplier-2"
    ]);
  });

  it("detects missing supplier", () => {
    const validation = validateAllItemsHaveSupplier([
      {
        ...baseItem,
        supplierCompanyId: null
      }
    ]);

    expect(validation.isValid).toBe(false);
    expect(() =>
      splitOrderBySupplier([
        {
          ...baseItem,
          supplierCompanyId: null
        }
      ])
    ).toThrow("มีรายการสินค้าที่ยังไม่มี supplier");
  });

  it("rejects empty items", () => {
    expect(validateAllItemsHaveSupplier([]).isValid).toBe(false);
    expect(() => splitOrderBySupplier([])).toThrow("ไม่มีรายการสินค้าให้แยก PO");
  });
});
