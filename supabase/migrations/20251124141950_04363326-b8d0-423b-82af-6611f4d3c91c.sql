-- Adicionar policy para permitir super_admins verem todos os cupons independente do tenant
CREATE POLICY "Super admins can view all coupons regardless of tenant"
ON institution_coupons
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Adicionar policy para permitir super_admins gerenciarem todos os cupons
CREATE POLICY "Super admins can manage all coupons regardless of tenant"
ON institution_coupons
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
);