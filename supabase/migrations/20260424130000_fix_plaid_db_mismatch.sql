-- Fix schema mismatch for Plaid data
-- Adds missing columns to user_financial_data table

ALTER TABLE public.user_financial_data
  ADD COLUMN IF NOT EXISTS plaid_access_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS identity_data_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS auth_numbers_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS identity_match JSONB;

-- Add comments for documentation
COMMENT ON COLUMN public.user_financial_data.plaid_access_token_encrypted IS 'Plaid access token for the connected item (encrypted)';
COMMENT ON COLUMN public.user_financial_data.identity_data_encrypted IS 'Verified identity data from Plaid (encrypted string)';
COMMENT ON COLUMN public.user_financial_data.auth_numbers_encrypted IS 'Plaid Auth: account and routing numbers (encrypted string)';
COMMENT ON COLUMN public.user_financial_data.identity_match IS 'Plaid Identity Match scores';
