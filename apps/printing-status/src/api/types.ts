import type { ProjectState } from '@study-centre/contracts/printing';

export type QuoteMaterialLine = {
  slot: 'primary' | 'secondary';
  material: string;
  filament_source?: string;
  grams: number;
  cost: number;
};

export type QuoteSnapshotLine = {
  part_id: string;
  part_number: number;
  part_name: string;
  total_grams: number;
  total_cost: number;
  materials: QuoteMaterialLine[];
};

export type QuoteSnapshot = {
  snapshot_version: number;
  status: 'ISSUED';
  generated_at: string;
  total_cost: number;
  currency: string;
  line_summary: QuoteSnapshotLine[];
};

export type PublicPartDto = {
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
};

export type PublicProjectDto = {
  project_code: string;
  collection_code: string | null;
  state: ProjectState | string;
  state_label: string;
  state_description: string;
  created_at: string;
  course: string | null;
  lecturer: string | null;
  currency: string;
  payment: {
    needs_payment: boolean;
    payment_state_label: string;
    receipt_number: string | null;
  };
  quote_snapshot: QuoteSnapshot | null;
  part_summary: {
    total_parts: number;
    completed_parts: number;
    printing_parts: number;
    queued_parts: number;
  };
  parts: PublicPartDto[];
};
