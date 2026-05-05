export type PosProduct = {
  id: string;
  sku: string;
  name: string;
  unitLabel: string;
  currency: string;
  sellPrice: string;
  categoryId: string | null;
  categoryName: string | null;
  trackStock: boolean;
  stockOnHand: string;
};

export type CartLine = {
  productId: string;
  sku: string;
  name: string;
  unitLabel: string;
  /** Original price stored as string in product currency. */
  unitPriceSrc: string;
  /** Original currency of the product line. */
  currency: string;
  /** Computed unit price in LAK, snapshotted at add-to-cart time. */
  unitPriceLak: string;
  qty: number;
};
