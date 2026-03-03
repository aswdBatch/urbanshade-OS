
-- Update has_role to handle co_creator
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (role = 'creator' AND _role IN ('co_creator', 'admin', 'moderator', 'user'))
        OR (role = 'co_creator' AND _role IN ('admin', 'moderator', 'user'))
        OR (role = 'admin' AND _role IN ('moderator', 'user'))
        OR (role = 'moderator' AND _role = 'user')
        OR (role = 'trial_admin' AND _role IN ('admin', 'moderator', 'user'))
      )
  )
$$;

-- Update get_user_role priority
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = _user_id 
  ORDER BY 
    CASE role 
      WHEN 'creator' THEN 1 
      WHEN 'co_creator' THEN 2
      WHEN 'admin' THEN 3 
      WHEN 'trial_admin' THEN 4
      WHEN 'moderator' THEN 5 
      WHEN 'user' THEN 6 
    END
  LIMIT 1
$$;

-- Update karlix from creator to co_creator
UPDATE public.user_roles 
SET role = 'co_creator' 
WHERE user_id = 'afc7a9b7-d66a-4777-9c58-1ea4e3d6c264' AND role = 'creator';
