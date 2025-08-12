-- Create storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES (
  'feedback-screenshots',
  'feedback-screenshots',
  false,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
);

-- Create RLS policies for feedback screenshots bucket
CREATE POLICY "Users can upload their own feedback screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'feedback-screenshots' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own feedback screenshots"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'feedback-screenshots' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Reuben admins can view all feedback screenshots"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'feedback-screenshots' AND 
  (
    ((current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com') OR
    ((current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com')
  )
);