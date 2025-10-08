-- Migration 2: Add RLS policies for super_author role on blog_posts

-- Super authors can view all posts (like admins)
CREATE POLICY "Super authors can view all posts"
  ON blog_posts FOR SELECT
  USING (has_role(auth.uid(), 'super_author'::app_role));

-- Super authors can update all posts
CREATE POLICY "Super authors can update all posts"
  ON blog_posts FOR UPDATE
  USING (has_role(auth.uid(), 'super_author'::app_role));

-- Super authors can delete all posts
CREATE POLICY "Super authors can delete all posts"
  ON blog_posts FOR DELETE
  USING (has_role(auth.uid(), 'super_author'::app_role));

-- Super authors can create posts for any author
CREATE POLICY "Super authors can create any posts"
  ON blog_posts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_author'::app_role));