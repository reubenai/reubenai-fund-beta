-- Add missing foreign key constraints for IC tables

-- First, check for any orphaned records that would prevent foreign key creation
-- Remove any invalid deal_id references in ic_memos
DELETE FROM ic_memos WHERE deal_id NOT IN (SELECT id FROM deals);

-- Remove any invalid fund_id references in ic_memos  
DELETE FROM ic_memos WHERE fund_id NOT IN (SELECT id FROM funds);

-- Remove any invalid fund_id references in deals
DELETE FROM deals WHERE fund_id NOT IN (SELECT id FROM funds);

-- Add foreign key constraints for ic_memos table
ALTER TABLE ic_memos 
ADD CONSTRAINT fk_ic_memos_deal_id 
FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;

ALTER TABLE ic_memos 
ADD CONSTRAINT fk_ic_memos_fund_id 
FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE;

-- Add foreign key constraint for deals table if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_deals_fund_id' 
        AND table_name = 'deals'
    ) THEN
        ALTER TABLE deals 
        ADD CONSTRAINT fk_deals_fund_id 
        FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints for other IC tables
-- ic_memo_versions
ALTER TABLE ic_memo_versions 
ADD CONSTRAINT fk_ic_memo_versions_deal_id 
FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;

ALTER TABLE ic_memo_versions 
ADD CONSTRAINT fk_ic_memo_versions_fund_id 
FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE;

-- ic_sessions
ALTER TABLE ic_sessions 
ADD CONSTRAINT fk_ic_sessions_fund_id 
FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE;

-- ic_voting_decisions  
ALTER TABLE ic_voting_decisions 
ADD CONSTRAINT fk_ic_voting_decisions_memo_id 
FOREIGN KEY (memo_id) REFERENCES ic_memos(id) ON DELETE CASCADE;

-- ic_session_deals
ALTER TABLE ic_session_deals 
ADD CONSTRAINT fk_ic_session_deals_session_id 
FOREIGN KEY (session_id) REFERENCES ic_sessions(id) ON DELETE CASCADE;

ALTER TABLE ic_session_deals 
ADD CONSTRAINT fk_ic_session_deals_deal_id 
FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;

-- ic_committee_members
ALTER TABLE ic_committee_members 
ADD CONSTRAINT fk_ic_committee_members_fund_id 
FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE;

-- ic_meetings
ALTER TABLE ic_meetings 
ADD CONSTRAINT fk_ic_meetings_fund_id 
FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE;

-- ic_meeting_deals
ALTER TABLE ic_meeting_deals 
ADD CONSTRAINT fk_ic_meeting_deals_meeting_id 
FOREIGN KEY (meeting_id) REFERENCES ic_meetings(id) ON DELETE CASCADE;

ALTER TABLE ic_meeting_deals 
ADD CONSTRAINT fk_ic_meeting_deals_deal_id 
FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;

-- ic_calendar_invites
ALTER TABLE ic_calendar_invites 
ADD CONSTRAINT fk_ic_calendar_invites_session_id 
FOREIGN KEY (session_id) REFERENCES ic_sessions(id) ON DELETE CASCADE;

-- ic_meeting_minutes
ALTER TABLE ic_meeting_minutes 
ADD CONSTRAINT fk_ic_meeting_minutes_session_id 
FOREIGN KEY (session_id) REFERENCES ic_sessions(id) ON DELETE CASCADE;

-- ic_decision_contexts
ALTER TABLE ic_decision_contexts 
ADD CONSTRAINT fk_ic_decision_contexts_fund_id 
FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE;

ALTER TABLE ic_decision_contexts 
ADD CONSTRAINT fk_ic_decision_contexts_deal_id 
FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

ALTER TABLE ic_decision_contexts 
ADD CONSTRAINT fk_ic_decision_contexts_memo_id 
FOREIGN KEY (memo_id) REFERENCES ic_memos(id) ON DELETE SET NULL;

ALTER TABLE ic_decision_contexts 
ADD CONSTRAINT fk_ic_decision_contexts_session_id 
FOREIGN KEY (ic_session_id) REFERENCES ic_sessions(id) ON DELETE SET NULL;