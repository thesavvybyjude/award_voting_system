// ── Awards Configuration ────────────────────────────────────────────
// This file is the single source of truth for all categories & nominees.
// Update this file with your actual data before the event.

import { 
  ADMIN_PIN as DEFAULT_ADMIN_PIN, 
  VOTE_PRICE_NAIRA as DEFAULT_VOTE_PRICE,
  EVENT_NAME as DEFAULT_EVENT_NAME,
  EVENT_TAGLINE as DEFAULT_TAGLINE,
  ENABLE_TRANSFER as DEFAULT_ENABLE_TRANSFER,
  BANK_TRANSFER_DETAILS as DEFAULT_BANK_DETAILS,
  WHATSAPP_VERIFY_NUMBER as DEFAULT_WHATSAPP,
  WHATSAPP_VERIFY_LINK as DEFAULT_WHATSAPP_LINK
} from "./default-config";

export interface NomineeConfig {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface CategoryConfig {
  id: string;
  name: string;
  type: "single" | "top2" | "duo";
  displayOrder: number;
  nominees: NomineeConfig[];
}

// Use env vars if provided, otherwise fall back to defaults
export const ADMIN_PIN = process.env.ADMIN_PIN || DEFAULT_ADMIN_PIN;

export const VOTE_PRICE_NAIRA = Number(process.env.NEXT_PUBLIC_VOTE_PRICE_NAIRA) || DEFAULT_VOTE_PRICE;
export const VOTE_PRICE_KOBO = VOTE_PRICE_NAIRA * 100;
export const EVENT_NAME = process.env.NEXT_PUBLIC_EVENT_NAME || DEFAULT_EVENT_NAME;
export const EVENT_TAGLINE = process.env.NEXT_PUBLIC_EVENT_TAGLINE || DEFAULT_TAGLINE;

// Payment providers - check env override first, otherwise use default-config.ts
// Env override: set NEXT_PUBLIC_ENABLE_XXX=true to enable, false to disable
// If env not set, use default-config.ts values

const envPaystack = process.env.NEXT_PUBLIC_ENABLE_PAYSTACK;
const envFlutterwave = process.env.NEXT_PUBLIC_ENABLE_FLUTTERWAVE;
const envTransfer = process.env.NEXT_PUBLIC_ENABLE_TRANSFER;

// Paystack: only enabled if env=true OR (has real keys AND env not false)
const hasPaystackKeys = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY && 
  !process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.includes("XXXXXXXX") &&
  process.env.PAYSTACK_SECRET_KEY &&
  !process.env.PAYSTACK_SECRET_KEY.includes("XXXXXXXX");

const hasFlutterwaveKeys = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY && 
  !process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY.includes("XXXXXXXX") &&
  process.env.FLUTTERWAVE_SECRET_KEY &&
  !process.env.FLUTTERWAVE_SECRET_KEY.includes("XXXXXXXX");

export const ENABLE_PAYSTACK = envPaystack === "true" || (hasPaystackKeys && envPaystack !== "false");
export const ENABLE_FLUTTERWAVE = envFlutterwave === "true" || (hasFlutterwaveKeys && envFlutterwave !== "false");
export const ENABLE_TRANSFER = envTransfer === "true" ? true : envTransfer === "false" ? false : DEFAULT_ENABLE_TRANSFER;

// Bank transfer - use defaults from default-config.ts
export const BANK_TRANSFER_DETAILS = process.env.BANK_NAME ? {
  bankName: process.env.BANK_NAME,
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || "0000000000",
  accountName: process.env.BANK_ACCOUNT_NAME || "Account Name",
  instructions: process.env.BANK_TRANSFER_INSTRUCTIONS || "Transfer the exact amount and click 'I've sent the money' below",
} : DEFAULT_BANK_DETAILS;

// WhatsApp - use defaults from default-config.ts
export const WHATSAPP_VERIFY_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_NUMBER || DEFAULT_WHATSAPP;
export const WHATSAPP_VERIFY_LINK = process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_LINK || DEFAULT_WHATSAPP_LINK;

export const awardsConfig: CategoryConfig[] = [
  {
    id: "most-popular-female",
    name: "Most Popular Female",
    type: "single",
    displayOrder: 1,
    nominees: [
      { id: "mpf-1", name: "Jolayemi-Peter Oreoluwakitan" },
      { id: "mpf-2", name: "Adefisan Peace" },
      { id: "mpf-3", name: "Ochanya Victoria" },
    ],
  },
  {
    id: "most-popular-male",
    name: "Most Popular Male",
    type: "single",
    displayOrder: 2,
    nominees: [
      { id: "mpm-1", name: "Abdallah Abdallah" },
      { id: "mpm-2", name: "Ngajo Jeremiah" },
      { id: "mpm-3", name: "Odiase Brian" },
      { id: "mpm-4", name: "Godfrey Delight" },
    ],
  },
  {
    id: "most-social-female",
    name: "Most Social Female",
    type: "single",
    displayOrder: 3,
    nominees: [
      { id: "msf-1", name: "Ochanya Victoria" },
      { id: "msf-2", name: "Abdulganiyu Lateefah" },
      { id: "msf-3", name: "Peter Polchong Precious" },
    ],
  },
  {
    id: "most-social-male",
    name: "Most Social Male",
    type: "single",
    displayOrder: 4,
    nominees: [
      { id: "msm-1", name: "Odiase Brian" },
      { id: "msm-2", name: "Ngajo Jeremiah" },
      { id: "msm-3", name: "Kolawole Toba" },
    ],
  },
  {
    id: "best-duo",
    name: "Best Duo",
    type: "duo",
    displayOrder: 5,
    nominees: [
      { id: "bd-1", name: "Aisha Gbadamosi and Ayegh Jessica" },
      { id: "bd-2", name: "Abdulkadir Hassan and Otuaga Eseoghene" },
      { id: "bd-3", name: "Yakubu Zainab and Maryam" },
    ],
  },
  {
    id: "most-confident-female",
    name: "Most Confident Female",
    type: "single",
    displayOrder: 6,
    nominees: [
      { id: "mcf-1", name: "Moses Elizabeth Oreoluwa" },
      { id: "mcf-2", name: "Otuaga Eseoghene" },
      { id: "mcf-3", name: "Jolayemi-Peter Oreoluwakitan" },
    ],
  },
  {
    id: "most-confident-male",
    name: "Most Confident Male",
    type: "single",
    displayOrder: 7,
    nominees: [
      { id: "mcm-1", name: "Oyekunle Adeniyi Oluwaseyi" },
      { id: "mcm-2", name: "Ahmad Mansur" },
      { id: "mcm-3", name: "Abdulkadir Hassan" },
    ],
  },
  {
    id: "best-dressed-male",
    name: "Best Dressed Male",
    type: "single",
    displayOrder: 8,
    nominees: [
      { id: "bdm-1", name: "Amaga Salem Ojima" },
      { id: "bdm-2", name: "Salau Promise" },
      { id: "bdm-3", name: "Mohammed Nasir" },
    ],
  },
  {
    id: "best-dressed-female",
    name: "Best Dressed Female",
    type: "single",
    displayOrder: 9,
    nominees: [
      { id: "bdf-1", name: "Edema Oristejeminetemi" },
      { id: "bdf-2", name: "Ayegba Shelter" },
    ],
  },
  {
    id: "class-comedian",
    name: "Class Comedian",
    type: "single",
    displayOrder: 10,
    nominees: [
      { id: "cc-1", name: "Salau Promise" },
      { id: "cc-2", name: "Odiase Brian" },
      { id: "cc-3", name: "Oyekunle Adeniyi Oluwaseyi" },
    ],
  },
  {
    id: "beauty-with-brains-female",
    name: "Beauty with Brains (Female)",
    type: "single",
    displayOrder: 11,
    nominees: [
      { id: "bwbf-1", name: "Aiyepe Halima" },
      { id: "bwbf-2", name: "Otuaga Eseoghene" },
      { id: "bwbf-3", name: "Abdulraheem Nafisat" },
      { id: "bwbf-4", name: "Maigidaje Hidaya" },
      { id: "bwbf-5", name: "Ochanya Victoria" },
    ],
  },
  {
    id: "funs-with-brains",
    name: "Funs with Brains",
    type: "single",
    displayOrder: 12,
    nominees: [
      { id: "fwb-1", name: "Gabriel Emmanuel Eneojo" },
      { id: "fwb-2", name: "Alex-Akpojoseve Ahmed" },
      { id: "fwb-3", name: "Godfrey Delight" },
      { id: "fwb-4", name: "Kolawole Toba" },
    ],
  },
  {
    id: "always-late-award",
    name: "Always Late Award",
    type: "single",
    displayOrder: 13,
    nominees: [
      { id: "ala-1", name: "Zainab Abdulsalm" },
      { id: "ala-2", name: "Otuaga Eseoghene" },
      { id: "ala-3", name: "Omale Joseph" },
      { id: "ala-4", name: "Adum Amarpepe Vanderfan" },
    ],
  },
  {
    id: "most-entrepreneurial-female",
    name: "Most Entrepreneurial Female",
    type: "single",
    displayOrder: 14,
    nominees: [
      { id: "mef-1", name: "Adefian Peace Folashade" },
      { id: "mef-2", name: "Oluruntoba Favour" },
    ],
  },
  {
    id: "most-entrepreneurial-male",
    name: "Most Entrepreneurial Male",
    type: "single",
    displayOrder: 15,
    nominees: [
      { id: "mem-1", name: "Abdulhaqq Tijani" },
      { id: "mem-2", name: "Ahmad Al-ameen" },
      { id: "mem-3", name: "Samuel Joseph" },
    ],
  },
  {
    id: "future-leader-award",
    name: "Future Leader Award",
    type: "single",
    displayOrder: 16,
    nominees: [
      { id: "fla-1", name: "Kolawole Toba" },
      { id: "fla-2", name: "Abdallah Abdallah" },
    ],
  },
  {
    id: "most-talented",
    name: "Most Talented",
    type: "single",
    displayOrder: 17,
    nominees: [
      { id: "mt-1", name: "Edema Oritsejeminetemi" },
      { id: "mt-2", name: "Joshua Dania" },
      { id: "mt-3", name: "Alex-Akpojosevbe Ahmed" },
    ],
  },
  {
    id: "music-icon",
    name: "Music Icon",
    type: "single",
    displayOrder: 18,
    nominees: [
      { id: "mi-1", name: "Alex-Akpojosevbe Ahmed" },
    ],
  },
  {
    id: "most-influential",
    name: "Most Influential",
    type: "single",
    displayOrder: 19,
    nominees: [
      { id: "minf-1", name: "Kolawole Toba" },
      { id: "minf-2", name: "Abdallah Abdallah" },
      { id: "minf-3", name: "Oyekunle Adeniyi OLuwaseyi" },
    ],
  },
  {
    id: "sportswoman",
    name: "Sportswoman",
    type: "single",
    displayOrder: 20,
    nominees: [
      { id: "sw-1", name: "Otuaga Eseoghene" },
      { id: "sw-2", name: "Oluruntoba Favour" },
    ],
  },
  {
    id: "sportsman",
    name: "Sportsman",
    type: "single",
    displayOrder: 21,
    nominees: [
      { id: "sm-1", name: "Kolawole Toba" },
      { id: "sm-2", name: "Joshua Dania" },
      { id: "sm-3", name: "Adum Amarpepe Vanderfan" },
    ],
  },
  {
    id: "face-of-computer-science",
    name: "Face of Computer Science Department",
    type: "single",
    displayOrder: 22,
    nominees: [
      { id: "fcs-1", name: "Abdallah Abdallah" },
      { id: "fcs-2", name: "Kolawole Toba" },
      { id: "fcs-3", name: "Yakubu Zainab" },
    ],
  },
];