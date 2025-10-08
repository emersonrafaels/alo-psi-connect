import { AdminLayout } from '@/components/admin/AdminLayout';
import { BlogPostsList } from '@/components/blog/BlogPostsList';

const BlogManagement = () => {
  return (
    <AdminLayout>
      <BlogPostsList />
    </AdminLayout>
  );
};

export default BlogManagement;
