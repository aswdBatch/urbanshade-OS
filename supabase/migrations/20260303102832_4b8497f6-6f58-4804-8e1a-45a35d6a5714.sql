-- Promote karlix to co-creator
UPDATE public.user_roles 
SET role = 'creator' 
WHERE user_id = 'afc7a9b7-d66a-4777-9c58-1ea4e3d6c264' AND role = 'admin';