export interface Product {
  name: string;
  price: number;
  quantity?: number;
  category?: string;
  description?: string;
}

export interface ReceiptData {
  id?: string; // Unique identifier for the receipt
  products: Product[];
  total: number;
  tax?: number;
  subtotal?: number;
  store?: string;
  date?: string;
  source?: 'analyzed' | 'excel' | 'cached'; // Track where the receipt came from
  duplicateOf?: string; // ID of receipt this is a duplicate of
}
