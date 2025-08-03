-- Check if there are any users in auth.users that need cleanup
-- Note: We can't directly query auth.users but we can clean up profiles
-- Remove any existing profile for agung@gothinkglobal.com to allow clean user creation
DELETE FROM profiles WHERE email = 'agung@gothinkglobal.com';