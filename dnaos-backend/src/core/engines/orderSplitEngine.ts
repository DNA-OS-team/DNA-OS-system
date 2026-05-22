export type SupplierSplitItemInput = {
  customerOrderItemId: string;
  productVariantId: string;
  supplierCompanyId: string | null;
  supplierProductId: string | null;
  description?: string | null;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  sortOrder: number;
};

export type SupplierOrderGroup = {
  supplierCompanyId: string;
  items: Array<SupplierSplitItemInput & { supplierCompanyId: string }>;
};

export function validateAllItemsHaveSupplier(items: SupplierSplitItemInput[]) {
  if (items.length === 0) {
    return {
      isValid: false,
      reason: "ไม่มีรายการสินค้าให้แยก PO"
    };
  }

  const missingSupplierItem = items.find((item) => !item.supplierCompanyId);

  if (missingSupplierItem) {
    return {
      isValid: false,
      reason: "มีรายการสินค้าที่ยังไม่มี supplier"
    };
  }

  return {
    isValid: true,
    reason: null
  };
}

export function groupItemsBySupplier(items: SupplierSplitItemInput[]) {
  const validation = validateAllItemsHaveSupplier(items);

  if (!validation.isValid) {
    throw new Error(validation.reason ?? "ไม่สามารถแยก PO ตาม supplier ได้");
  }

  const groupsBySupplier = items.reduce<Record<string, SupplierOrderGroup>>(
    (result, item) => {
      const supplierCompanyId = item.supplierCompanyId as string;
      const group = result[supplierCompanyId] ?? {
        supplierCompanyId,
        items: []
      };

      group.items.push({
        ...item,
        supplierCompanyId
      });
      result[supplierCompanyId] = group;

      return result;
    },
    {}
  );

  return Object.values(groupsBySupplier).sort((left, right) =>
    left.supplierCompanyId.localeCompare(right.supplierCompanyId)
  );
}

export function splitOrderBySupplier(items: SupplierSplitItemInput[]) {
  return groupItemsBySupplier(items);
}
