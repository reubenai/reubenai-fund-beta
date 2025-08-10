-- Fix duplicate Katey profiles - keep the one attached to Think Global
-- First, delete the duplicate profile attached to Bear Venture Group
DELETE FROM public.profiles 
WHERE email = 'katey.shaw@bearventuregroup.com' 
AND organization_id = '746729ad-6424-4aef-9b31-d580e72ecd14';

-- Now remove the Bear Venture Group organization we incorrectly created
DELETE FROM public.organizations WHERE name = 'Bear Venture Group';

-- Verify we have only one Katey profile now, attached to Think Global
SELECT 
  p.email,
  p.role,
  o.name as organization_name,
  p.is_deleted,
  'Cleaned Profile' as status
FROM public.profiles p
JOIN public.organizations o ON p.organization_id = o.id
WHERE p.email = 'katey.shaw@bearventuregroup.com';