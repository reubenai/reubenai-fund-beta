
-- 1) Deal documents table: allow INSERT for users who can access the deal's fund

-- Keep existing super admin ALL policy; add a standard user INSERT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'deal_documents' 
      AND policyname = 'Users can insert deal documents for accessible deals'
  ) THEN
    CREATE POLICY "Users can insert deal documents for accessible deals"
    ON public.deal_documents
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.deals d
        WHERE d.id = deal_id
          AND user_can_access_fund(d.fund_id)
      )
    );
  END IF;
END$$;

-- 2) Storage policies for deal-documents bucket
-- We try to drop a few known policy names; if they don't exist this is harmless.

DO $$
BEGIN
  -- Drop older policy names if they exist, to avoid conflicts
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Users can view deal documents for accessible deals'
  ) THEN
    DROP POLICY "Users can view deal documents for accessible deals" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Users can upload deal documents for accessible deals'
  ) THEN
    DROP POLICY "Users can upload deal documents for accessible deals" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Users can update deal documents for accessible deals'
  ) THEN
    DROP POLICY "Users can update deal documents for accessible deals" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Users can delete deal documents for accessible deals'
  ) THEN
    DROP POLICY "Users can delete deal documents for accessible deals" ON storage.objects;
  END IF;

  -- Drop any simplified policies we may have created earlier
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'deal-docs select') THEN
    DROP POLICY "deal-docs select" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'deal-docs insert') THEN
    DROP POLICY "deal-docs insert" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'deal-docs update') THEN
    DROP POLICY "deal-docs update" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'deal-docs delete') THEN
    DROP POLICY "deal-docs delete" ON storage.objects;
  END IF;
END$$;

-- Recreate robust policies tied to the deal prefix in object name
-- We assume object key format: "<deal_id>/<filename>"

CREATE POLICY "deal-docs select"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'deal-documents' AND
  EXISTS (
    SELECT 1
    FROM public.deals d
    WHERE d.id = NULLIF(split_part(name, '/', 1), '')::uuid
      AND user_can_access_fund(d.fund_id)
  )
);

CREATE POLICY "deal-docs insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'deal-documents' AND
  EXISTS (
    SELECT 1
    FROM public.deals d
    WHERE d.id = NULLIF(split_part(name, '/', 1), '')::uuid
      AND user_can_access_fund(d.fund_id)
  )
);

CREATE POLICY "deal-docs update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'deal-documents' AND
  EXISTS (
    SELECT 1
    FROM public.deals d
    WHERE d.id = NULLIF(split_part(name, '/', 1), '')::uuid
      AND user_can_access_fund(d.fund_id)
  )
);

CREATE POLICY "deal-docs delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'deal-documents' AND
  EXISTS (
    SELECT 1
    FROM public.deals d
    WHERE d.id = NULLIF(split_part(name, '/', 1), '')::uuid
      AND user_can_access_fund(d.fund_id)
  )
);
