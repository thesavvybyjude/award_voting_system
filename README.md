# Faculty of Computing Awards Voting System

A modern voting platform for awarding students with payment options including Flutterwave. Features real-time admin dashboard, free voting for specific categories, live updates via Supabase, and comprehensive transaction logging.

## Features

### Payment Options
- **Flutterwave** - Card, USSD, Mobile Money, Transfer (auto-disabled if keys missing/invalid)
- **Bank Transfer** - Manual transfer with 9-minute countdown timer, requires admin approval (can be disabled)

### Free Voting Categories
Certain awards are free to vote on - no payment required. Configure in `src/lib/awards.config.ts`:

```typescript
export const FREE_AWARD_CATEGORIES = [
  "sportsman",
  "sportswoman",
  "best-duo",
  "always-late-award",
  "class-comedian",
];
```

Users can vote once per nominee in free categories. Votes are recorded immediately without payment. Admin sees free vs paid vote breakdown in results.

### Payment Verification
- **WhatsApp Integration** - Users can send payment confirmation via WhatsApp after bank transfer
- **Auto-disable** - Payment providers automatically disable if API keys are missing or placeholder values
- **Provider Tracking** - Each transaction is tagged with its payment method (Flutterwave/Manual Transfer/Free)

### Admin Dashboard (PIN-protected)
- **Overview Tab** - Real-time stats: total votes, revenue, voters count, free vs paid breakdown
- **Results Tab** - Live voting results per category with nominee rankings, free/paid vote tags
- **Review Tab** - Approve pending bank transfers before votes are counted
- **Transactions Tab** - Complete transaction log with PDF download, filter by provider
- **Lock Tab** - Secure admin session

### Real-time Updates
- All admin pages use Supabase Realtime for live data
- Instant updates when new votes come in
- Pending transfers appear in real-time
- Free and paid votes tracked separately

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

### Supabase (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_xxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### Payment Providers (At least one required)

**Flutterwave**:
```
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx
```

**Paystack**:
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
```

**Bank Transfer**:
```
BANK_NAME=GTBank
BANK_ACCOUNT_NUMBER=1234567890
BANK_ACCOUNT_NAME=Faculty Awards
BANK_TRANSFER_INSTRUCTIONS=Transfer the exact amount...
```

### Payment Toggles
```
NEXT_PUBLIC_ENABLE_PAYSTACK=true
NEXT_PUBLIC_ENABLE_FLUTTERWAVE=true
NEXT_PUBLIC_ENABLE_TRANSFER=true  # Set to false to disable bank transfer
```

### WhatsApp Verification
```
NEXT_PUBLIC_WHATSAPP_VERIFY_NUMBER=2348126369366
```

### Admin & Voting
```
ADMIN_PIN=2026
NEXT_PUBLIC_VOTE_PRICE_NAIRA=200
```

## Configuration

### Default Config (`src/lib/default-config.ts`)
Public configuration that can be committed to GitHub:
- Event name and tagline
- Vote price
- Payment provider toggles (default states)
- Bank transfer details
- WhatsApp number for verification
- Admin PIN (default: 2026)

### Environment Override
All values in `default-config.ts` can be overridden by environment variables. For client-side values, use `NEXT_PUBLIC_` prefix.

### Payment Provider Auto-disable Rules
- If Paystack keys are missing or contain placeholder (`pk_live_XXXXXXXXXXXXXXXX`), Paystack is automatically disabled
- If Flutterwave keys are missing or contain placeholder (`FLWPUBK-XXXXXXXXXXXXXXXX-X`), Flutterwave is automatically disabled
- Manual override: set `NEXT_PUBLIC_ENABLE_PAYSTACK=false` or `NEXT_PUBLIC_ENABLE_FLUTTERWAVE=false`

## Database Setup

1. Go to [Supabase Dashboard](https://supabase.com)
2. Open SQL Editor
3. Copy contents of `supabase/migration.sql` and run

The migration creates:
- `categories` - Award categories
- `nominees` - Nominees per category
- `transactions` - Payment records with provider tracking
- `votes` - Individual votes per nominee
- Row Level Security policies
- Supabase Realtime for votes and transactions tables

## Admin Access

1. Go to `/admin`
2. Enter PIN (default: `2026`)
3. Navigate between tabs:
   - **Overview** - Total votes, revenue, voter count
   - **Results** - Category-by-category results
   - **Review** - Approve pending bank transfers
   - **Transactions** - View all transactions, download PDF
   - **Lock** - End admin session

## User Flow

1. **Home** - View event info and price
2. **Vote** - Select nominees across all categories
3. **Summary** - Review selections, choose payment method
4. **Payment**:
   - Card (Paystack/Flutterwave) - Instant verification
   - Bank Transfer - 9-minute timer, then submit and verify via WhatsApp
5. **Success** - Confirmation page

## Transaction Log

Located at `/admin/transactions`:
- Shows all transactions (success, pending, failed)
- Filter by payment provider (Flutterwave, Manual, Free)
- Displays: date, reference, amount, votes, status
- **Download PDF** - Generate printable transaction report

## Free vs Paid Vote Tracking

Admin results page shows breakdown:
- Green badge = free votes
- Blue badge = paid votes
- Stats API returns `freeVotes`, `paidVotes`, `freeVoters`, `paidVoters`

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Realtime)
- **Payments**: Paystack, Flutterwave
- **Icons**: Tabler Icons

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin dashboard (5 tabs)
│   │   ├── page.tsx        # Overview
│   │   ├── results/        # Results
│   │   ├── pending/       # Review transfers
│   │   └── transactions/  # Transaction log + PDF
│   ├── api/
│   │   ├── verify-payment/    # Paystack/Flutterwave verification
│   │   ├── create-manual-transaction/  # Bank transfer creation
│   │   └── admin/         # Admin API routes
│   ├── vote/              # Voting flow
│   │   ├── page.tsx       # Category selection
│   │   ├── summary/       # Payment selection
│   │   └── success/       # Confirmation
│   └── page.tsx           # Home page
├── components/             # React components
├── contexts/              # VoteContext (state management)
├── lib/
│   ├── awards.config.ts   # Categories, nominees, config
│   ├── default-config.ts  # Public default values
│   ├── paystack.ts        # Paystack integration
│   ├── flutterwave.ts     # Flutterwave integration
│   └── supabase/          # Supabase client/server
└── types/                 # TypeScript types
```

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Run database migration in Supabase
5. Deploy

## License

MIT