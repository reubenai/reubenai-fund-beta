-- EMERGENCY SECURITY FIX: Fix missing profiles and strengthen RLS
-- 1. Recreate Katey's missing profile
INSERT INTO public.profiles (user_id, email, role, organization_id, created_at, updated_at, is_deleted)
VALUES (
  '1bc2f8df-0d70-4537-9a76-7be7d5435b97',
  'katey.shaw@bearventuregroup.com',
  'viewer',
  'db3b0ed3-036f-4811-9ebc-69fdb09f628b',  -- Think Global organization
  now(),
  now(),
  false
);

-- 2. Check and fix any other users missing profiles
INSERT INTO public.profiles (user_id, email, role, organization_id, created_at, updated_at, is_deleted)
SELECT 
  au.id,
  au.email,
  'viewer'::user_role,
  NULL, -- Will need manual assignment by admin
  now(),
  now(),
  false
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. FORCE ENABLE RLS on all critical tables to ensure it's actually working
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Verify the RLS policies exist and are correct
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  qual
FROM pg_policies 
WHERE tablename = 'funds' AND schemaname = 'public';