-- =====================================================
-- PORTAL INSTITUCIONAL - PARTE 1: Adicionar Role
-- =====================================================

-- Adicionar role 'institution_admin' ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'institution_admin';