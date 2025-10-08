-- Create blog_posts table
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  featured_image_url text,
  author_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamp with time zone,
  read_time_minutes integer,
  views_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);

-- Create blog_tags table
CREATE TABLE blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

-- Create blog_post_tags junction table
CREATE TABLE blog_post_tags (
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Add index to comments for better performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Enable RLS on all blog tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
CREATE POLICY "Anyone can view published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authors can view their own posts"
  ON blog_posts FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all posts"
  ON blog_posts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authors can create posts"
  ON blog_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND 
    (has_role(auth.uid(), 'author'::app_role) OR 
     has_role(auth.uid(), 'admin'::app_role) OR 
     has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Authors can update their own posts"
  ON blog_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can update all posts"
  ON blog_posts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authors can delete their own posts"
  ON blog_posts FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete all posts"
  ON blog_posts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for blog_tags
CREATE POLICY "Anyone can view tags"
  ON blog_tags FOR SELECT
  USING (true);

CREATE POLICY "Authors and admins can manage tags"
  ON blog_tags FOR ALL
  USING (
    has_role(auth.uid(), 'author'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  );

-- RLS Policies for blog_post_tags
CREATE POLICY "Anyone can view post tags"
  ON blog_post_tags FOR SELECT
  USING (true);

CREATE POLICY "Authors can manage their post tags"
  ON blog_post_tags FOR ALL
  USING (
    post_id IN (
      SELECT id FROM blog_posts WHERE author_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all post tags"
  ON blog_post_tags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at on blog_posts
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment post views
CREATE OR REPLACE FUNCTION increment_post_views(post_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE blog_posts
  SET views_count = views_count + 1
  WHERE slug = post_slug AND status = 'published';
END;
$$;

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for blog images
CREATE POLICY "Anyone can view blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "Authors can upload blog images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'blog-images' AND
    (has_role(auth.uid(), 'author'::app_role) OR 
     has_role(auth.uid(), 'admin'::app_role) OR 
     has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Authors can update their blog images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'blog-images' AND
    (has_role(auth.uid(), 'author'::app_role) OR 
     has_role(auth.uid(), 'admin'::app_role) OR 
     has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Authors can delete their blog images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'blog-images' AND
    (has_role(auth.uid(), 'author'::app_role) OR 
     has_role(auth.uid(), 'admin'::app_role) OR 
     has_role(auth.uid(), 'super_admin'::app_role))
  );