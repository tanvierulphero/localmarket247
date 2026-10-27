import { Document, DocumentType, BusinessSettings } from '../types';

/**
 * Generates sequential document numbers for Challan, Invoice, Quotation, Bill, and Offer Letter.
 * Rather than picking random numbers, this extracts existing trailing numbers for that document type
 * and increments by 1 (+1) sequentially (0001, 0002, 0003...).
 */
export function generateNextDocNumber(
  type: DocumentType,
  documents: Document[] = [],
  settings?: Partial<BusinessSettings>
): string {
  const prefix = 
    type === 'OFFER_LETTER' ? (settings?.offerPrefix || 'JM/OF/2026/') :
    type === 'QUOTATION' ? (settings?.quotePrefix || 'JM/QT/2026/') :
    type === 'BILL' ? (settings?.billPrefix || 'JM/BILL/2026/') :
    type === 'CHALLAN' ? (settings?.challanPrefix || 'JM/CH/2026/') :
    (settings?.invoicePrefix || 'JM/INV/2026/');

  // Filter existing documents matching this type or prefix
  const matchingDocs = (documents || []).filter(d => {
    if (!d || !d.docNumber) return false;
    if (d.type === type) return true;
    if (d.docNumber.startsWith(prefix)) return true;
    return false;
  });

  const numbers: number[] = [];
  for (const doc of matchingDocs) {
    if (!doc.docNumber) continue;
    // Extract trailing number digits e.g. "JM/INV/2026/0005" -> 5
    const match = doc.docNumber.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        numbers.push(num);
      }
    }
  }

  let nextNum = 1;
  // If sequential numbers exist under 1000 (0001, 0002...), take max + 1
  const sequentialNumbers = numbers.filter(n => n < 1000);
  if (sequentialNumbers.length > 0) {
    nextNum = Math.max(...sequentialNumbers) + 1;
  } else if (numbers.length > 0) {
    // If only legacy 4-digit numbers existed (>= 1000, e.g. old random numbers 1000-9999)
    // If total documents is small (< 50), start sequential from matchingDocs.length + 1
    if (matchingDocs.length < 50) {
      nextNum = matchingDocs.length + 1;
    } else {
      nextNum = Math.max(...numbers) + 1;
    }
  } else {
    nextNum = 1;
  }

  // Format with 4 digits padding: 0001, 0002, 0003...
  const padLength = Math.max(4, String(nextNum).length);
  const numStr = String(nextNum).padStart(padLength, '0');

  return `${prefix}${numStr}`;
}
