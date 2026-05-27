import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import PatientsTriageView from '@/components/triagem/PatientsTriageView';

export default function Triagem() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <PatientsTriageView
          title="Triagem"
          subtitle="Listagem completa de pacientes com histórico do diário emocional e encontros."
          redirectOnDenied="/"
        />
      </main>
      <Footer />
    </div>
  );
}
