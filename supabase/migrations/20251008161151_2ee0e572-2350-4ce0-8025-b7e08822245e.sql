-- Migration 1: Add 'author' and 'super_author' roles to app_role enum
-- Note: 'author' is already used in code but missing from enum

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin', 'super_admin', 'moderator');
  END IF;
END $$;

-- Add 'author' role if it doesn't exist
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'author';

-- Add 'super_author' role if it doesn't exist
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_author';