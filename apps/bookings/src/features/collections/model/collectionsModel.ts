import { type HexForgeCollectionPart, type HexForgeCollectionProject } from '@/api/printingCollections';

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
};

export const collectableStatuses = new Set(['PRINTED', 'POST_PROCESSING']);

export const printTone = (
  status: string,
): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  if (status === 'COLLECTED') return 'success';
  if (status === 'PRINTED' || status === 'POST_PROCESSING') return 'info';
  if (status === 'PRINTING') return 'primary';
  if (status === 'FAILED') return 'error';
  return 'default';
};

export const formatMoney = (value: number, currency = 'ZAR') => {
  const symbol = currency === 'ZAR' ? 'R' : currency;
  return `${symbol} ${Number(value || 0).toFixed(2)}`;
};

export const normalizeProjectCode = (value: string) => value.trim().toUpperCase();

export const extractStudentNumber = (value: string) => value.match(/\d{8}/)?.[0] || '';

export const getSavedReceipt = (project: HexForgeCollectionProject | null) =>
  project?.collection?.receipt_number || project?.payment.receipt_number || '';

export const projectNeedsReceipt = (project: HexForgeCollectionProject | null) =>
  Boolean(project?.payment.needs_payment && !project.payment.module_paid);

export const projectIsPaid = (project: HexForgeCollectionProject | null) => {
  if (!project) return false;
  if (!project.payment.needs_payment || project.payment.module_paid) return true;
  return Boolean(getSavedReceipt(project).trim());
};

export const canCollectPart = (part: HexForgeCollectionPart) => collectableStatuses.has(part.print_status);

export const isCollectedPart = (part: HexForgeCollectionPart) => part.print_status === 'COLLECTED';

export const formatPrintStatus = (status: string) => {
  if (status === 'POST_PROCESSING') return 'Printed';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const collectionStatusLabel = (part: HexForgeCollectionPart) => {
  if (isCollectedPart(part)) return 'Collected';
  if (canCollectPart(part)) return 'Ready to collect';
  return part.print_status === 'POST_PROCESSING'
    ? 'Printed'
    : part.print_status_label || formatPrintStatus(part.print_status);
};
