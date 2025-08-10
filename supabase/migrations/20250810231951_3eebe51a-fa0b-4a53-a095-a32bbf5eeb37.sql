-- Fix Katey's profile to attach to Think Global instead of Bear Venture Group
-- First, remove the Bear Venture Group organization we incorrectly created
DELETE FROM public.organizations WHERE name = 'Bear Venture Group';

-- Update Katey's profile to use Think Global organization
UPDATE public.profiles 
SET 
  organization_id = (SELECT id FROM public.organizations WHERE name = 'Think Global' LIMIT 1),
  is_deleted = false,
  updated_at = now()
WHERE email = 'katey.shaw@bearventuregroup.com';

-- Verify the fix worked
SELECT 
  p.email,
  p.role,
  o.name as organization_name,
  p.is_deleted,
  'Fixed Profile' as status
FROM public.profiles p
JOIN public.organizations o ON p.organization_id = o.id
WHERE p.email = 'katey.shaw@bearventuregroup.com';