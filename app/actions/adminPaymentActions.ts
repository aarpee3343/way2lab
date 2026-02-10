'use server';

import { recordManualPaymentAction } from '@/app/actions/adminFinanceActions';

export async function collectPaymentAction(orderId: number, amount: number, method: string, txnId: string, notes: string) {
  return recordManualPaymentAction({
    orderId,
    amount,
    method,
    transactionId: txnId,
    notes,
  });
}
