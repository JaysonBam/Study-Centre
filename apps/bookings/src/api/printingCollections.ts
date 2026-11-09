import { createPrintingRequest } from './_internal/printingRequest';

export type HexForgeCollectionBoardItem = {
  project_code: string;
  priority_number: number;
  student_name: string;
  student_number: string;
  state: string;
  group: 'help_desk' | 'partially_ready' | null;
  print_label: string | null;
  total_parts: number;
  completed_parts: number;
  collected_parts: number;
  remaining_parts: number;
  all_parts_completed: boolean;
  thumbnail_url: string | null;
  thumbnail_part_name: string | null;
  thumbnail_weight: number;
  payment_outstanding: boolean;
  last_activity_at: string | null;
};

export type HexForgeCollectionEmailDraft = {
  to: string;
  student_number?: string;
  subject: string;
  body: string;
  html_body?: string;
};

export type HexForgeCollectionPart = {
  part_id: string;
  part_number: number;
  part_name: string;
  print_status: string;
  print_status_label: string;
  thumbnail_url: string | null;
  printer_name: string | null;
  primary_material: string | null;
  primary_brand: string | null;
  primary_estimated_weight: number | null;
  secondary_material: string | null;
  secondary_brand: string | null;
  secondary_estimated_weight: number | null;
  total_cost: number;
  collection?: {
    collected_by: string | null;
    collected_by_student_number: string | null;
    collected_at: string | null;
    special_instruction: string | null;
  };
};

export type HexForgeCollectionProject = {
  project_code: string;
  priority_number: number;
  collection_code: string | null;
  state: string;
  state_label: string;
  state_description: string;
  created_at: string;
  course: string | null;
  lecturer: string | null;
  cost_total: number;
  currency: string;
  payment: {
    needs_payment: boolean;
    payment_state_label: string;
    receipt_number: string | null;
    module_paid: boolean | null;
    override_applied: boolean | null;
  };
  part_summary: {
    total_parts: number;
    completed_parts: number;
    printing_parts: number;
    queued_parts: number;
  };
  parts: HexForgeCollectionPart[];
  collection?: {
    student_name: string;
    student_number: string;
    print_label: string | null;
    receipt_number: string | null;
    needs_payment: boolean;
    module_or_lecturer_pays: boolean;
    created_at: string;
  };
};

const requestHexForgeCollection = createPrintingRequest({
  functionName: 'bookings-collection',
  missingConfiguration: 'HexForge collection access is not configured.',
  signedOut: 'You must be signed in to use collection tools.',
  failure: 'HexForge collection request failed',
});

export const fetchHexForgeCollectionBoard = () =>
  requestHexForgeCollection<HexForgeCollectionBoardItem[]>('/board');

export const searchHexForgeCollection = (query: string) =>
  requestHexForgeCollection<HexForgeCollectionBoardItem[]>(`/search?q=${encodeURIComponent(query)}`);

export const fetchHexForgeCollectionProject = (projectCode: string) =>
  requestHexForgeCollection<HexForgeCollectionProject>(`?code=${encodeURIComponent(projectCode)}`);

export const saveHexForgeCollectionReceipt = (projectCode: string, receiptNumber: string) =>
  requestHexForgeCollection<HexForgeCollectionProject>('/receipt', {
    method: 'PATCH',
    body: JSON.stringify({ projectCode, receiptNumber }),
  });

export const collectHexForgeParts = (
  projectCode: string,
  partIds: string[],
  collectorName: string,
  collectedByStudentNumber: string,
) =>
  requestHexForgeCollection<{ project: HexForgeCollectionProject }>('/collect', {
    method: 'POST',
    body: JSON.stringify({ projectCode, partIds, collectorName, collectedByStudentNumber }),
  });

export const releaseHexForgeCollectionProject = (projectCode: string, printLabel?: string) =>
  requestHexForgeCollection<{ project: HexForgeCollectionProject; warnings: string[] }>('/release', {
    method: 'POST',
    body: JSON.stringify({ projectCode, printLabel }),
  });

export const prepareHexForgeCollectionEmail = (projectCode: string) =>
  requestHexForgeCollection<HexForgeCollectionEmailDraft>('/email', {
    method: 'POST',
    body: JSON.stringify({ projectCode }),
  });
