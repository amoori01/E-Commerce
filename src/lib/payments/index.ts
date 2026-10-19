import { PaymentGateway } from '@/types';
import { PaymentProvider } from './types';
import { ChapaProvider } from './chapa';
import { TelebirrProvider } from './telebirr';
import { CbeBirrProvider } from './cbe-birr';
import { BankTransferProvider } from './bank-transfer';

export * from './types';
export * from './chapa';
export * from './telebirr';
export * from './cbe-birr';
export * from './bank-transfer';

const PROVIDER_REGISTRY: Record<PaymentGateway, PaymentProvider> = {
  chapa: new ChapaProvider(),
  telebirr: new TelebirrProvider(),
  cbe_birr: new CbeBirrProvider(),
  bank_transfer: new BankTransferProvider(),
};

/**
 * Returns the configured payment provider adapter for a specific payment rail.
 */
export function getPaymentProvider(gateway: PaymentGateway): PaymentProvider {
  const provider = PROVIDER_REGISTRY[gateway];
  if (!provider) {
    throw new Error(`Unsupported payment gateway: '${gateway}'`);
  }
  return provider;
}
