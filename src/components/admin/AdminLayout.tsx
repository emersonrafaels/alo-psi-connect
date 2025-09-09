import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { isAdmin, loading } = useAdminAuth();

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

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">
                Painel Administrativo
              </h1>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">
                  AloPsi
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 space-y-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};