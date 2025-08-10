-- Safely fix Katey's profile by transferring any data and then cleaning up
-- First, transfer any activity events from the duplicate profile to the correct one
UPDATE public.activity_events 
SET user_id = 'e4ef66a2-fb6a-4504-bc5c-265f39f8901d'
WHERE user_id = '1bc2f8df-0d70-4537-9a76-7be7d5435b97';

-- Now we can safely delete the duplicate profile
DELETE FROM public.profiles 
WHERE user_id = '1bc2f8df-0d70-4537-9a76-7be7d5435b97' 
AND email = 'katey.shaw@bearventuregroup.com';

-- Remove the Bear Venture Group organization we incorrectly created
DELETE FROM public.organizations WHERE id = '746729ad-6424-4aef-9b31-d580e72ecd14';

-- Verify we have only one Katey profile now, attached to Think Global
SELECT 
  p.email,
  p.role, 
  o.name as organization_name,
  p.is_deleted,
  'Fixed and Cleaned' as status
FROM public.profiles p
JOIN public.organizations o ON p.organization_id = o.id
WHERE p.email = 'katey.shaw@bearventuregroup.com';