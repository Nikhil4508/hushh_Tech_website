-- Fix schema mismatch for Plaid data
-- Adds missing columns to user_financial_data table

ALTER TABLE public.user_financial_data
  ADD COLUMN IF NOT EXISTS plaid_access_token TEXT,
  ADD COLUMN IF NOT EXISTS identity_data JSONB,
  ADD COLUMN IF NOT EXISTS auth_numbers JSONB,
  ADD COLUMN IF NOT EXISTS identity_match JSONB;

-- Add comments for documentation
COMMENT ON COLUMN public.user_financial_data.plaid_access_token IS 'Plaid access token for the connected item';
COMMENT ON COLUMN public.user_financial_data.identity_data IS 'Verified identity data from Plaid (names, addresses, etc.)';
COMMENT ON COLUMN public.user_financial_data.auth_numbers IS 'Plaid Auth: account and routing numbers';
COMMENT ON COLUMN public.user_financial_data.identity_match IS 'Plaid Identity Match scores';
