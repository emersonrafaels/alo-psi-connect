-- Create table for group session theme suggestions
CREATE TABLE public.group_session_theme_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  nome TEXT,
  tema TEXT NOT NULL,
  descricao TEXT,
  tenant_id UUID REFERENCES public.tenants(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_session_theme_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all suggestions
CREATE POLICY "Admins can view all theme suggestions"
ON public.group_session_theme_suggestions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- Policy: System can insert suggestions
CREATE POLICY "Anyone can insert theme suggestions"
ON public.group_session_theme_suggestions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_group_session_theme_suggestions_updated_at
  BEFORE UPDATE ON public.group_session_theme_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_theme_suggestions_tenant_id ON public.group_session_theme_suggestions(tenant_id);
CREATE INDEX idx_theme_suggestions_status ON public.group_session_theme_suggestions(status);
CREATE INDEX idx_theme_suggestions_created_at ON public.group_session_theme_suggestions(created_at DESC);