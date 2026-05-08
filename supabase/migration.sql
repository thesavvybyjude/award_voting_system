-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Class Awards Voting System – Database Migration            ║
-- ║  Run this in the Supabase SQL Editor                        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'top2', 'duo')),
  emoji TEXT DEFAULT '🏏',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Nominees table
CREATE TABLE IF NOT EXISTS nominees (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nominees_category ON nominees(category_id);

-- Transactions table (one per payment)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  amount_total INT NOT NULL,          -- in kobo
  total_votes INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payment_provider TEXT DEFAULT 'flutterwave' CHECK (payment_provider IN ('paystack', 'flutterwave', 'manual')),
  vote_selections JSONB,              -- stores selections for manual transactions (before approval)
  payer_name TEXT,                    -- optional: name of person who transferred
  payer_phone TEXT,                   -- optional: phone of person who transferred
  paystack_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ             -- when admin approved manual payment
);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Votes table (one row per nominee-vote in a transaction)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  nominee_id TEXT NOT NULL REFERENCES nominees(id),
  vote_count INT NOT NULL CHECK (vote_count > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_votes_nominee ON votes(nominee_id);
CREATE INDEX IF NOT EXISTS idx_votes_category ON votes(category_id);
CREATE INDEX IF NOT EXISTS idx_votes_transaction ON votes(transaction_id);

-- ── Row Level Security ──────────────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Public read for categories and nominees
CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "Public read nominees" ON nominees FOR SELECT TO anon USING (true);

-- Votes: public read (for results display), only service_role inserts
CREATE POLICY "Public read votes" ON votes FOR SELECT TO anon USING (true);

-- Transactions: no anon access (server-only via service_role)

-- ── Enable Realtime ─────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
