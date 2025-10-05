import { ReceiptData } from '@/types/product';

// Generate a unique ID for a receipt based on its key characteristics
export function generateReceiptId(receipt: ReceiptData): string {
  const store = receipt.store?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown';
  const date = receipt.date?.replace(/[^0-9]/g, '') || 'unknown';
  const total = Math.round((receipt.total || 0) * 100); // Convert to cents to avoid floating point issues
  const productCount = receipt.products?.length || 0;
  
  // Create a hash-like ID from key characteristics
  return `${store}-${date}-${total}-${productCount}`;
}

// Check if two receipts are likely the same
export function areReceiptsSimilar(receipt1: ReceiptData, receipt2: ReceiptData): boolean {
  // Check if they have the same generated ID
  if (generateReceiptId(receipt1) === generateReceiptId(receipt2)) {
    return true;
  }
  
  // Additional similarity checks
  const storeMatch = !!(receipt1.store && receipt2.store && 
    receipt1.store.toLowerCase() === receipt2.store.toLowerCase());
  
  const dateMatch = !!(receipt1.date && receipt2.date && 
    receipt1.date === receipt2.date);
  
  const totalMatch = Math.abs((receipt1.total || 0) - (receipt2.total || 0)) < 0.01; // Within 1 cent
  
  const productCountMatch = (receipt1.products?.length || 0) === (receipt2.products?.length || 0);
  
  // Consider similar if store, date, total, and product count match
  return storeMatch && dateMatch && totalMatch && productCountMatch;
}

// Find duplicates in a list of receipts
export function findDuplicates(receipts: ReceiptData[]): ReceiptData[] {
  const duplicates: ReceiptData[] = [];
  
  // First, assign IDs to all receipts
  receipts.forEach(receipt => {
    if (!receipt.id) {
      receipt.id = generateReceiptId(receipt);
    }
    if (!receipt.source) {
      receipt.source = 'analyzed';
    }
  });
  
  // Group receipts by their ID
  const receiptGroups = new Map<string, ReceiptData[]>();
  receipts.forEach(receipt => {
    const id = receipt.id!;
    if (!receiptGroups.has(id)) {
      receiptGroups.set(id, []);
    }
    receiptGroups.get(id)!.push(receipt);
  });
  
  // Find groups with multiple receipts (duplicates)
  receiptGroups.forEach((group, id) => {
    if (group.length > 1) {
      // Sort by source priority: excel > cached > analyzed
      const sourcePriority = { 'excel': 0, 'cached': 1, 'analyzed': 2 };
      group.sort((a, b) => {
        const aPriority = sourcePriority[a.source as keyof typeof sourcePriority] ?? 3;
        const bPriority = sourcePriority[b.source as keyof typeof sourcePriority] ?? 3;
        return aPriority - bPriority;
      });
      
      // Keep the first one (highest priority) as original, mark others as duplicates
      const original = group[0];
      const duplicatesInGroup = group.slice(1);
      
      duplicatesInGroup.forEach(duplicate => {
        duplicate.duplicateOf = id;
        duplicates.push(duplicate);
      });
    }
  });
  
  return duplicates;
}

// Assign IDs to all receipts and mark sources
export function processReceipts(receipts: ReceiptData[], source: 'analyzed' | 'excel' | 'cached' = 'analyzed'): ReceiptData[] {
  return receipts.map(receipt => ({
    ...receipt,
    id: receipt.id || generateReceiptId(receipt),
    source: receipt.source || source
  }));
}
