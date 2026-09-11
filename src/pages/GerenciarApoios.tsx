import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import SupportLibraryAdmin from '@/pages/admin/SupportLibraryAdmin';

export default function GerenciarApoios() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <SupportLibraryAdmin />
      </main>
      <Footer />
    </div>
  );
}
