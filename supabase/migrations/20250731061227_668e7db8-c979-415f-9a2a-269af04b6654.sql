-- Storage policies for document management

-- Policies for deal-documents bucket
CREATE POLICY "Users can view deal documents for accessible deals"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'deal-documents' AND
  name IN (
    SELECT CONCAT(d.id::text, '/', dd.storage_path)
    FROM deals d
    JOIN deal_documents dd ON d.id = dd.deal_id
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload deal documents for accessible deals"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'deal-documents' AND
  auth.uid() IS NOT NULL AND
  -- Extract deal_id from path (format: deal_id/filename)
  substring(name, 1, position('/' in name) - 1)::uuid IN (
    SELECT d.id
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'fund_manager', 'analyst')
  )
);

CREATE POLICY "Users can update deal documents for accessible deals"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'deal-documents' AND
  substring(name, 1, position('/' in name) - 1)::uuid IN (
    SELECT d.id
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'fund_manager', 'analyst')
  )
);

CREATE POLICY "Users can delete deal documents for accessible deals"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'deal-documents' AND
  substring(name, 1, position('/' in name) - 1)::uuid IN (
    SELECT d.id
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'fund_manager', 'analyst')
  )
);

-- Policies for fund-documents bucket
CREATE POLICY "Users can view fund documents for accessible funds"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'fund-documents' AND
  substring(name, 1, position('/' in name) - 1)::uuid IN (
    SELECT f.id
    FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Fund managers can manage fund documents"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'fund-documents' AND
  substring(name, 1, position('/' in name) - 1)::uuid IN (
    SELECT f.id
    FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'fund_manager')
  )
)
WITH CHECK (
  bucket_id = 'fund-documents' AND
  substring(name, 1, position('/' in name) - 1)::uuid IN (
    SELECT f.id
    FROM funds f
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'fund_manager')
  )
);

-- Policies for organization-documents bucket
CREATE POLICY "Organization members can view organization documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'organization-documents' AND
  substring(name, 1, position('/' in name) - 1)::uuid IN (
    SELECT p.organization_id
    FROM profiles p
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage organization documents"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'organization-documents' AND
  substring(name, 1, position('/' in name) - 1)::uuid IN (
    SELECT p.organization_id
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'fund_manager')
  )
)
WITH CHECK (
  bucket_id = 'organization-documents' AND
  substring(name, 1, position('/' in name) - 1)::uuid IN (
    SELECT p.organization_id
    FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'fund_manager')
  )
);