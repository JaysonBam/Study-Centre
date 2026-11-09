import assert from 'node:assert/strict';
import test from 'node:test';
import { canShowCollectionBarcode, getIssuedQuoteDisplay, getProgressSummary } from './publicViewRules.ts';

test('collection barcode is limited to active collection states', () => {
  assert.equal(canShowCollectionBarcode('READY_FOR_COLLECTION'), true);
  assert.equal(canShowCollectionBarcode('PARTIALLY_COLLECTED'), true);
  for (const state of ['REVIEW', 'AWAITING_PAYMENT', 'IN_PRODUCTION', 'CLOSED', 'CANCELLED']) {
    assert.equal(canShowCollectionBarcode(state), false, state);
  }
});

test('quote display uses only an issued snapshot', () => {
  assert.equal(getIssuedQuoteDisplay(null), null);
  assert.deepEqual(
    getIssuedQuoteDisplay({ total_cost: 66, currency: 'ZAR', generated_at: '2026-06-10T00:00:00Z' }),
    { total: 66, currency: 'ZAR', issuedAt: '2026-06-10T00:00:00Z' },
  );
});

test('progress summaries stay concise and grammatical', () => {
  assert.equal(getProgressSummary(0, 0), 'No parts added yet');
  assert.equal(getProgressSummary(0, 1), 'No parts completed yet');
  assert.equal(getProgressSummary(1, 1), 'All 1 part complete');
  assert.equal(getProgressSummary(1, 6), '1 of 6 parts complete');
});
