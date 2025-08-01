-- Create Think Global organization
INSERT INTO public.organizations (name, domain)
VALUES ('Think Global', 'gothinkglobal.com');

-- Verify the organization was created
SELECT * FROM public.organizations WHERE name = 'Think Global';