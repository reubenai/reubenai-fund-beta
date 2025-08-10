-- Create default pipeline stages for the MAD Hyperscalers Fund
INSERT INTO pipeline_stages (fund_id, name, color, position, is_default) VALUES
('bb53614c-0015-46b0-b298-b9af1c2c8425', 'Sourced', '#10B981', 0, true),
('bb53614c-0015-46b0-b298-b9af1c2c8425', 'Screening', '#F59E0B', 1, true),
('bb53614c-0015-46b0-b298-b9af1c2c8425', 'Investment Committee', '#3B82F6', 2, true),
('bb53614c-0015-46b0-b298-b9af1c2c8425', 'Due Diligence', '#8B5CF6', 3, true),
('bb53614c-0015-46b0-b298-b9af1c2c8425', 'Approved', '#06B6D4', 4, true),
('bb53614c-0015-46b0-b298-b9af1c2c8425', 'Invested', '#10B981', 5, true),
('bb53614c-0015-46b0-b298-b9af1c2c8425', 'Rejected', '#EF4444', 6, true)
ON CONFLICT (fund_id, name) DO NOTHING;