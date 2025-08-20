-- Add unique constraint on fund_id for investment_strategies table
ALTER TABLE investment_strategies ADD CONSTRAINT investment_strategies_fund_id_unique UNIQUE (fund_id);