// Default Configuration - Committed to GitHub
// Sensitive keys (Supabase, Flutterwave, Paystack) stay in .env

export const ADMIN_PIN = "2026";

export const VOTE_PRICE_NAIRA = 200;
export const VOTE_PRICE_KOBO = VOTE_PRICE_NAIRA * 100;

export const EVENT_NAME = "Faculty of Computing Awards 2026";
export const EVENT_TAGLINE = "Vote for Your Favorites";

// Payment Provider Toggles
export const ENABLE_PAYSTACK = false;
export const ENABLE_FLUTTERWAVE = true;
export const ENABLE_TRANSFER = true;

// Bank Transfer Details
export const BANK_TRANSFER_DETAILS = {
  bankName: "GTBank",
  accountNumber: "8126369366",
  accountName: "Faculty Awards",
  instructions: "Transfer the exact amount and click \"I've sent the money\" below. Your transfer will be reviewed and approved within 24 hours.",
};

// WhatsApp for Payment Verification
export const WHATSAPP_VERIFY_NUMBER = "2348126369366";
export const WHATSAPP_VERIFY_LINK = "https://wa.me/+2348126369366";