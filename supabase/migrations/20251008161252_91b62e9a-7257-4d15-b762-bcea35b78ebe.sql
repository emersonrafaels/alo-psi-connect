-- Migration 3: Add curation fields to blog_posts table

-- Fields for Featured Posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_order INTEGER;

-- Index for featured posts queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured 
  ON blog_posts(is_featured, featured_order) 
  WHERE is_featured = true;

-- Enum for Editorial Badges
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'editorial_badge') THEN
    CREATE TYPE editorial_badge AS ENUM (
      'editors_pick',
      'trending',
      'must_read',
      'community_favorite',
      'staff_pick'
    );
  END IF;
END $$;

-- Editorial badge column and expiration
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS editorial_badge editorial_badge;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS badge_expires_at TIMESTAMPTZ;

-- Index for editorial badge queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_editorial_badge 
  ON blog_posts(editorial_badge) 
  WHERE editorial_badge IS NOT NULL;