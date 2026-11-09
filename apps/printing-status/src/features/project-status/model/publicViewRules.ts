export type IssuedQuoteDisplay = {
  total: number;
  currency: string;
  issuedAt: string;
} | null;

export function canShowCollectionBarcode(state: string) {
  return state === 'READY_FOR_COLLECTION' || state === 'PARTIALLY_COLLECTED';
}

export function getProgressSummary(completed: number, total: number) {
  if (total === 0) return 'No parts added yet';
  if (completed === 0) return 'No parts completed yet';
  if (completed >= total) return `All ${total} part${total === 1 ? '' : 's'} complete`;
  return `${completed} of ${total} parts complete`;
}

export function getIssuedQuoteDisplay(
  snapshot: { total_cost: number; currency: string; generated_at: string } | null | undefined,
): IssuedQuoteDisplay {
  if (!snapshot) return null;
  return {
    total: Number(snapshot.total_cost || 0),
    currency: snapshot.currency || 'ZAR',
    issuedAt: snapshot.generated_at,
  };
}
