export type ProjectState =
  | 'INTAKE'
  | 'REVIEW'
  | 'QUOTE'
  | 'AWAITING_PAYMENT'
  | 'READY_FOR_PRINTING'
  | 'IN_PRODUCTION'
  | 'READY_FOR_COLLECTION'
  | 'PARTIALLY_COLLECTED'
  | 'CLOSED'
  | 'CANCELLED';

export type PrintStatus =
  'DRAFT' | 'VERIFIED' | 'READY' | 'PRINTING' | 'PRINTED' | 'FAILED' | 'POST_PROCESSING' | 'COLLECTED';

export type FilamentSource = 'misc' | 'student_provided' | 'module_provided';
