-- Fix critical RLS security issue for emergency_ops_control table
ALTER TABLE emergency_ops_control ENABLE ROW LEVEL SECURITY;

-- Only Reuben admins can manage emergency controls
CREATE POLICY "Reuben admins can manage emergency controls" 
ON emergency_ops_control FOR ALL 
USING (is_reuben_email())
WITH CHECK (is_reuben_email());