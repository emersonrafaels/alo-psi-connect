-- Create deleted_users audit table
CREATE TABLE public.deleted_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_user_id uuid NOT NULL,
  email text NOT NULL,
  nome text NOT NULL,
  tipo_usuario text NOT NULL,
  deleted_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_by uuid REFERENCES auth.users(id),
  deletion_reason text,
  user_data jsonb -- Store additional user data for audit
);

-- Enable RLS
ALTER TABLE public.deleted_users ENABLE ROW LEVEL SECURITY;

-- Create policies for deleted_users
CREATE POLICY "Super admins can view deleted users" 
ON public.deleted_users 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can insert deleted users" 
ON public.deleted_users 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_deleted_users_email ON public.deleted_users(email);
CREATE INDEX idx_deleted_users_deleted_at ON public.deleted_users(deleted_at);