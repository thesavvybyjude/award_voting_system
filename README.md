# Faculty of Computing Awards Voting System

A modern voting platform for awarding students with multiple payment options including Paystack, Flutterwave, and bank transfer.

## Features

- **Multiple Payment Methods**: Paystack, Flutterwave, and Bank Transfer
- **Auto-disable**: Payment providers automatically disable if API keys are missing/invalid
- **Real-time Results**: Live voting statistics on admin dashboard
- **Manual Approval**: Bank transfer payments require admin approval before votes are counted
- **Admin Dashboard**: PIN-protected admin area with live stats
- **Pending Transfers**: View and approve pending bank transfers

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env` to `.env.local` and fill in your values:

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Payment Providers (at least one required)

**Flutterwave**:
```
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx
FLUTTERWAVE_SECRET_HASH=your_hash
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
NEXT_PUBLIC_ENABLE_TRANSFER=true
```

### Admin
```
ADMIN_PIN=1234
NEXT_PUBLIC_VOTE_PRICE_NAIRA=200
```

## Payment Provider Rules

- If Paystack keys are missing or are placeholder values (`pk_live_XXXXXXXXXXXXXXXX`), Paystack is automatically disabled
- If Flutterwave keys are missing or are placeholder values (`FLWPUBK-XXXXXXXXXXXXXXXX-X`), Flutterwave is automatically disabled
- You can also manually disable providers by setting their enable flag to `false`

## Database Setup

Run the migration in Supabase SQL Editor:

1. Go to [Supabase Dashboard](https://supabase.com)
2. Open SQL Editor
3. Copy contents of `supabase/migration.sql` and run

## Admin Access

1. Go to `/admin`
2. Enter PIN (default: `1234`)
3. View real-time stats, results, and pending transfers
4. Approve pending bank transfers in `/admin/pending`

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Payments**: Paystack, Flutterwave
- **Icons**: Tabler Icons

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard pages
│   ├── api/            # API routes
│   ├── vote/           # Voting flow pages
│   └── page.tsx        # Home page
├── components/         # React components
├── contexts/           # React contexts
├── lib/                # Utilities and config
└── types/              # TypeScript types
```

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## License

MIT