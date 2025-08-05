-- Update Manila Angels pipeline stages to standardized names
UPDATE pipeline_stages 
SET name = 'Screening'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Manila Angels') 
  AND name = 'Initial Review' 
  AND position = 1;

UPDATE pipeline_stages 
SET name = 'Approved'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Manila Angels') 
  AND name = 'Offer Negotiation' 
  AND position = 4;

UPDATE pipeline_stages 
SET name = 'Invested'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Manila Angels') 
  AND name = 'Closed' 
  AND position = 5;

UPDATE pipeline_stages 
SET name = 'Rejected'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Manila Angels') 
  AND name = 'Passed' 
  AND position = 6;

-- Update Think Global Fund 0 pipeline stages to standardized names
UPDATE pipeline_stages 
SET name = 'Screening'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Think Global Fund 0') 
  AND name = 'Initial Review' 
  AND position = 1;

UPDATE pipeline_stages 
SET name = 'Approved'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Think Global Fund 0') 
  AND name = 'Offer Negotiation' 
  AND position = 4;

UPDATE pipeline_stages 
SET name = 'Invested'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Think Global Fund 0') 
  AND name = 'Closed' 
  AND position = 5;

UPDATE pipeline_stages 
SET name = 'Rejected'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Think Global Fund 0') 
  AND name = 'Passed' 
  AND position = 6;

-- Update Reuben Fund III pipeline stages to standardized names
UPDATE pipeline_stages 
SET name = 'Screening'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Reuben Fund III') 
  AND name = 'Initial Review' 
  AND position = 1;

UPDATE pipeline_stages 
SET name = 'Approved'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Reuben Fund III') 
  AND name = 'Offer Negotiation' 
  AND position = 4;

UPDATE pipeline_stages 
SET name = 'Invested'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Reuben Fund III') 
  AND name = 'Closed' 
  AND position = 5;

UPDATE pipeline_stages 
SET name = 'Rejected'
WHERE fund_id IN (SELECT id FROM funds WHERE name = 'Reuben Fund III') 
  AND name = 'Passed' 
  AND position = 6;