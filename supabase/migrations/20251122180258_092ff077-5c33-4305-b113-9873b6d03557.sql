-- Add RLS policy to allow super_admin to delete profiles
CREATE POLICY "Super admin can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add cascade delete for complaints when a user is deleted
ALTER TABLE public.complaints
DROP CONSTRAINT IF EXISTS complaints_student_id_fkey;

ALTER TABLE public.complaints
ADD CONSTRAINT complaints_student_id_fkey
FOREIGN KEY (student_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add cascade delete for profiles when auth user is deleted
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;