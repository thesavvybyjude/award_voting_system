declare module '@paystack/inline-js' {
  interface PaystackOptions {
    key: string;
    email: string;
    amount: number;
    reference?: string;
    currency?: string;
    channels?: string[];
    label?: string;
    callback?: (response: { reference: string }) => void;
    onSuccess?: (transaction: Record<string, unknown>) => void;
    onClose?: () => void;
  }

  class PaystackPop {
    constructor();
    newTransaction(options: PaystackOptions): {
      initialize: (callback?: (response: { reference: string }) => void) => void;
    };
  }

  export default PaystackPop;
}