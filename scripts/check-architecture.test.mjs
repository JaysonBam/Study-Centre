import assert from 'node:assert/strict';
import test from 'node:test';
import { importViolations } from './check-architecture.mjs';

test('features use public API operations and shared code, not provider clients', () => {
  assert.deepEqual(importViolations('features/bookings/hooks/useSchedule.ts', '../../../api/bookings'), []);
  assert.ok(
    importViolations('features/bookings/hooks/useSchedule.ts', '../../../api/_internal/supabase').length,
  );
  assert.ok(importViolations('pages/BookingsPage.tsx', '@supabase/supabase-js').length);
  assert.deepEqual(importViolations('api/bookings.ts', '@supabase/supabase-js'), []);
});

test('dependency direction keeps shared/API code independent of UI features', () => {
  assert.ok(importViolations('api/projects.ts', '@/features/projects/context').length);
  assert.ok(importViolations('shared/ui/Button.tsx', '../../features/booking/Button').length);
  assert.ok(importViolations('features/bookings/model/validate.ts', 'react').length);
  assert.deepEqual(importViolations('features/bookings/model/validate.ts', 'react', true), []);
  assert.deepEqual(importViolations('api/helper.ts', '@study-centre/contracts/helper'), []);
});
