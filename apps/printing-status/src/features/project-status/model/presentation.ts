import type { ProjectState } from '@study-centre/contracts/printing';
import type { PublicProjectDto } from '@/api/types';

type StatusPresentation = {
  label: string;
  description: string;
  color: string;
  background: string;
  border: string;
  milestone: number;
};

export const milestones = ['Submitted', 'Reviewed', 'Quote', 'Production', 'Collection'];

const statePresentation: Record<ProjectState, StatusPresentation> = {
  INTAKE: {
    label: 'Submitted',
    description: 'Your request has been received.',
    color: '#475569',
    background: '#f8fafc',
    border: '#cbd5e1',
    milestone: 0,
  },
  REVIEW: {
    label: 'Under review',
    description: 'MISC is checking your files, materials, and print details.',
    color: '#1d4ed8',
    background: '#eff6ff',
    border: '#bfdbfe',
    milestone: 1,
  },
  QUOTE: {
    label: 'Quote in progress',
    description: 'Your quote is being prepared.',
    color: '#9a5b13',
    background: '#fff8e8',
    border: '#f6d58b',
    milestone: 2,
  },
  AWAITING_PAYMENT: {
    label: 'Payment required',
    description: 'Your quote is ready. Payment must be completed before production starts.',
    color: '#9a5b13',
    background: '#fff8e8',
    border: '#f6d58b',
    milestone: 2,
  },
  READY_FOR_PRINTING: {
    label: 'Scheduled for production',
    description: 'Your project is approved and waiting for a machine slot.',
    color: '#0f766e',
    background: '#effcf9',
    border: '#99e5d8',
    milestone: 3,
  },
  IN_PRODUCTION: {
    label: 'In production',
    description: 'Your parts are queued or currently printing.',
    color: '#0f766e',
    background: '#effcf9',
    border: '#99e5d8',
    milestone: 3,
  },
  READY_FOR_COLLECTION: {
    label: 'Ready to collect',
    description: 'Your project is ready at the MISC front desk.',
    color: '#2f6d3a',
    background: '#f1f9f2',
    border: '#b9dfbe',
    milestone: 4,
  },
  PARTIALLY_COLLECTED: {
    label: 'Collection in progress',
    description: 'Some items have been collected. Check the parts below for what remains.',
    color: '#6d4aae',
    background: '#f7f3ff',
    border: '#d9ccf3',
    milestone: 4,
  },
  CLOSED: {
    label: 'Collected and complete',
    description: 'This project has been collected and closed.',
    color: '#486422',
    background: '#f5f9ec',
    border: '#d4e4af',
    milestone: 4,
  },
  CANCELLED: {
    label: 'Project cancelled',
    description: 'This project has been cancelled by MISC.',
    color: '#5b6472',
    background: '#f5f6f7',
    border: '#d6dae0',
    milestone: -1,
  },
};

const printPresentation: Record<string, { label: string; color: string; background: string }> = {
  REVIEWING: { label: 'Reviewing', color: '#1d4ed8', background: '#eff6ff' },
  VERIFIED: { label: 'Approved', color: '#6d4aae', background: '#f7f3ff' },
  QUEUED: { label: 'Queued', color: '#536171', background: '#f3f5f7' },
  PRINTING: { label: 'Printing', color: '#0f766e', background: '#effcf9' },
  PRINTED: { label: 'Printed', color: '#2f6d3a', background: '#f1f9f2' },
  COLLECTED: { label: 'Collected', color: '#486422', background: '#f5f9ec' },
};

export function getStatusPresentation(project: PublicProjectDto) {
  return (
    statePresentation[project.state as ProjectState] || {
      label: project.state_label || project.state,
      description: project.state_description || `Current status: ${project.state}`,
      color: '#475569',
      background: '#f8fafc',
      border: '#cbd5e1',
      milestone: 0,
    }
  );
}

export function getPrintPresentation(projectState: string, partStatus: string) {
  if (projectState === 'INTAKE' || projectState === 'REVIEW') return printPresentation.REVIEWING;
  if (
    projectState === 'QUOTE' ||
    projectState === 'AWAITING_PAYMENT' ||
    projectState === 'READY_FOR_PRINTING'
  )
    return printPresentation.VERIFIED;
  if (partStatus === 'COLLECTED') return printPresentation.COLLECTED;
  if (partStatus === 'PRINTING') return printPresentation.PRINTING;
  if (partStatus === 'PRINTED' || partStatus === 'POST_PROCESSING') return printPresentation.PRINTED;
  return printPresentation.QUEUED;
}

export function formatMoney(value: number, currency = 'ZAR') {
  const symbol = currency === 'ZAR' ? 'R' : currency;
  return `${symbol} ${Number(value || 0).toFixed(2)}`;
}

export function formatDate(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function getPaymentText(project: PublicProjectDto) {
  const payment = project.payment;
  if (payment.payment_state_label === 'RECEIPT_RECORDED') {
    return `Payment recorded under receipt ${payment.receipt_number || 'N/A'}.`;
  }
  if (payment.payment_state_label === 'MODULE_OR_LECTURER_PAID')
    return 'Payment is covered by the module or lecturer.';
  if (payment.payment_state_label === 'NOT_REQUIRED') return 'No payment is required for this project.';
  if (payment.needs_payment) return 'Payment still needs to be recorded.';
  return '';
}
