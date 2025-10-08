import { Navigate, Link } from 'react-router-dom';
import { useAuthorRole } from '@/hooks/useAuthorRole';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu, Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogLayoutProps {
  children: React.ReactNode;
}

export const BlogLayout = ({ children }: BlogLayoutProps) => {
  const { isAuthor, loading } = useAuthorRole();
  const { signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex h-16 items-center border-b px-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex">
          <div className="w-64 border-r">
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthor) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-8 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted">
                <Menu className="h-4 w-4" />
              </SidebarTrigger>
              <h1 className="text-xl font-semibold text-foreground">
                Gerenciar Blog
              </h1>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">
                  AloPsi
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Voltar ao Site</span>
                </Link>
              </Button>
              <Button onClick={signOut} variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <div className="container mx-auto px-6 py-6 space-y-6 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
