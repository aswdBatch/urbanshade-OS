
-- Allow admins to insert site lock rows
CREATE POLICY "Admins can insert site lock"
ON public.site_locks
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
