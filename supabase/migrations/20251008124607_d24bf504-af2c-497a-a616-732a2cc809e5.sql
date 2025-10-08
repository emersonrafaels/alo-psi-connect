-- Add comment and rating controls to blog_posts
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS allow_ratings BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ratings_count INTEGER DEFAULT 0;

-- Create blog_post_ratings table
CREATE TABLE IF NOT EXISTS blog_post_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_rating UNIQUE NULLS NOT DISTINCT (post_id, user_id),
  CONSTRAINT unique_session_rating UNIQUE NULLS NOT DISTINCT (post_id, session_id),
  CONSTRAINT rating_requires_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE blog_post_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ratings
CREATE POLICY "Anyone can view ratings"
  ON blog_post_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert ratings"
  ON blog_post_ratings FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can update their ratings"
  ON blog_post_ratings FOR UPDATE
  USING (
    (auth.uid() = user_id) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_ratings ON blog_post_ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings ON blog_post_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_session_ratings ON blog_post_ratings(session_id);

-- Function to update post ratings
CREATE OR REPLACE FUNCTION update_post_ratings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE blog_posts
  SET 
    ratings_count = (
      SELECT COUNT(*) 
      FROM blog_post_ratings 
      WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    ),
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) 
      FROM blog_post_ratings 
      WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update post ratings automatically
DROP TRIGGER IF EXISTS trigger_update_post_ratings ON blog_post_ratings;
CREATE TRIGGER trigger_update_post_ratings
AFTER INSERT OR UPDATE OR DELETE ON blog_post_ratings
FOR EACH ROW
EXECUTE FUNCTION update_post_ratings();

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_rating_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rating_updated_at ON blog_post_ratings;
CREATE TRIGGER trigger_rating_updated_at
BEFORE UPDATE ON blog_post_ratings
FOR EACH ROW
EXECUTE FUNCTION update_rating_updated_at();