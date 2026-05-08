import type { PaystackOptions } from "@/types";

export function openPaystackPopup({
  amount,
  email,
  reference,
  onSuccess,
  onClose,
}: PaystackOptions) {
  import("@paystack/inline-js").then(({ default: PaystackPop }) => {
    const popup = new PaystackPop();
    let callbackFired = false;

    const handleSuccess = (transaction: Record<string, unknown>) => {
      callbackFired = true;
      onSuccess({
        reference: (transaction.reference as string) || reference,
        trans: (transaction.trans as string) || "",
        status: (transaction.status as string) || "success",
        message: (transaction.message as string) || "Payment successful",
        transaction: (transaction.transaction as string) || "",
        trxref: (transaction.trxref as string) || reference,
      });
    };

    popup.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email,
      amount,
      reference,
      onSuccess: handleSuccess,
      onClose: () => {
        if (!callbackFired) {
          const fallbackData = {
            reference,
            status: "pending",
          };
          const form = document.createElement("form");
          form.method = "POST";
          form.action = "/api/verify-payment";
          form.style.display = "none";
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = "payload";
          input.value = JSON.stringify({ ...fallbackData, selections: [] });
          form.appendChild(input);
          document.body.appendChild(form);
          onClose();
        } else {
          onClose();
        }
      },
    });

    setTimeout(() => {
      if (!callbackFired) {
        console.warn("Paystack callback did not fire within 30s. Payment may need manual verification.");
      }
    }, 30000);
  });
}

export function generateReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `vot_${timestamp}_${random}`;
}
