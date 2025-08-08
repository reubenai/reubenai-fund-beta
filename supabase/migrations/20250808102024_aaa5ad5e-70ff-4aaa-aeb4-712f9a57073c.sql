-- Add soft delete columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_deleted boolean DEFAULT false,
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Create index for better performance when filtering deleted users
CREATE INDEX idx_profiles_is_deleted ON public.profiles(is_deleted) WHERE is_deleted = false;

-- Create DELETE RLS policy for profiles table (only super admins can delete)
CREATE POLICY "Super admins can delete users" 
ON public.profiles 
FOR DELETE 
USING (
  is_reuben_admin() OR 
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'
);

-- Create UPDATE RLS policy for soft delete operations
CREATE POLICY "Super admins can soft delete users" 
ON public.profiles 
FOR UPDATE 
USING (
  is_reuben_admin() OR 
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'
);

-- Update existing SELECT policies to filter out deleted users by default
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
CREATE POLICY "Users can view profiles in their organization" 
ON public.profiles 
FOR SELECT 
USING (
  (is_deleted = false OR is_deleted IS NULL) AND
  (is_reuben_admin() OR 
   organization_id IN (
     SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
   ))
);