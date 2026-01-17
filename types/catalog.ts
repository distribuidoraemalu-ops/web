export type Product = {
  id: string;          // normalized unique id (sku/ingramPartNumber/etc.)
  sku: string;
  title: string;
  vendorName?: string;
  price?: number;
  currency?: string;
  stock?: number;
  imageUrl?: string;
};

export type CatalogResponse = {
  correlationId: string;
  items: Product[];
  page: number;
  pageSize: number;
  totalPages?: number; // if vendor provides it
  totalItems?: number; // if vendor provides it
};
