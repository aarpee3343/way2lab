export type PaymentState = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED' | 'CORPORATE_BILLING';

const TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  PENDING: ['PARTIAL', 'PAID', 'CORPORATE_BILLING'],
  PARTIAL: ['PENDING', 'PAID', 'REFUNDED'],
  PAID: ['PARTIAL', 'REFUNDED'],
  REFUNDED: ['PENDING', 'PARTIAL', 'PAID'],
  CORPORATE_BILLING: ['PARTIAL', 'PAID'],
};

export function normalizePaymentState(input?: string | null): PaymentState {
  const raw = String(input || '').trim().toUpperCase();
  if (!raw) return 'PENDING';
  if (raw === 'PENDING') return 'PENDING';
  if (raw === 'PARTIAL') return 'PARTIAL';
  if (raw === 'PAID') return 'PAID';
  if (raw === 'REFUNDED') return 'REFUNDED';
  if (raw === 'CORPORATE_BILLING') return 'CORPORATE_BILLING';
  return 'PENDING';
}

export function toStoredPaymentStatus(state: PaymentState): string {
  if (state === 'PENDING') return 'Pending';
  if (state === 'PARTIAL') return 'Partial';
  if (state === 'PAID') return 'Paid';
  if (state === 'REFUNDED') return 'Refunded';
  return 'CORPORATE_BILLING';
}

export function canTransitionPaymentState(currentRaw: string | null | undefined, targetRaw: string | null | undefined) {
  const current = normalizePaymentState(currentRaw);
  const target = normalizePaymentState(targetRaw);
  if (current === target) return true;
  return TRANSITIONS[current].includes(target);
}

export function derivePaymentState(params: {
  finalAmount: number;
  totalPaid: number;
  totalRefunded: number;
  currentStatus?: string | null;
}): PaymentState {
  const finalAmount = Number(params.finalAmount || 0);
  const totalPaid = Number(params.totalPaid || 0);
  const totalRefunded = Number(params.totalRefunded || 0);
  const netPaid = totalPaid - totalRefunded;
  const current = normalizePaymentState(params.currentStatus);

  if (current === 'CORPORATE_BILLING' && netPaid <= 0) return 'CORPORATE_BILLING';
  if (finalAmount <= 0) return 'PAID';
  if (netPaid <= 0) return totalRefunded > 0 ? 'REFUNDED' : 'PENDING';
  if (netPaid + 0.5 >= finalAmount) return 'PAID';
  return 'PARTIAL';
}
