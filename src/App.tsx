import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/contexts/TenantContext";
import { TenantGuard } from "@/components/TenantGuard";
import { useTenant } from "@/hooks/useTenant";
import { useGlobalCacheShortcut } from "@/hooks/useGlobalCacheShortcut";
import { useEffect, useState } from "react";
import WhatsAppFloat from "@/components/ui/whatsapp-float";
import ScrollToTopButton from "@/components/ui/scroll-to-top-button";
import { FirstLoginWelcome } from "@/components/FirstLoginWelcome";
import { DomainRedirect } from "@/components/DomainRedirect";

// Pages
import Index from "./pages/Index";
import About from "./pages/About";
import InstitutionPortal from "./pages/InstitutionPortal";
import InstitutionProfessionals from "./pages/InstitutionProfessionals";
import InstitutionStudents from "./pages/InstitutionStudents";
import GroupSessions from "./pages/GroupSessions";
import GroupSessionDetail from "./pages/GroupSessionDetail";
import MyGroupSessions from "./pages/MyGroupSessions";
import ManageGroupSessions from "./pages/ManageGroupSessions";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Professional from "./pages/Professional";
import Professionals from "./pages/Professionals";
import Schedule from "./pages/Schedule";
import Appointment from "./pages/Appointment";
import AppointmentAccess from "./pages/AppointmentAccess";
import BookingConfirmation from "./pages/BookingConfirmation";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import Contact from "./pages/Contact";
import WorkWithUs from "./pages/WorkWithUs";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import GoogleCalendarCallback from "./pages/GoogleCalendarCallback";
import UserType from "./pages/register/UserType";
import PatientForm from "./pages/register/PatientForm";
import ProfessionalForm from "./pages/register/ProfessionalForm";
import Profile from "./pages/Profile";
import ProfessionalProfile from "./pages/ProfessionalProfile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

// Appointment management pages
import MyAppointments from "./pages/MyAppointments";
import RescheduleAppointment from "./pages/RescheduleAppointment";

// Mood diary pages
import MoodDiary from "./pages/MoodDiary";
import MoodExperience from "./pages/MoodExperience";
import MoodEntry from "./pages/MoodEntry";
import MoodHistory from "./pages/MoodHistory";
import MoodAnalytics from "./pages/MoodAnalytics";
import EmotionConfigPage from "./pages/EmotionConfigPage";

// Admin pages
import { AdminLayout } from "@/components/admin/AdminLayout";
import { BlogLayout } from "@/components/blog/BlogLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminUsers from "@/pages/admin/Users";
import AdminConfigurations from "@/pages/admin/Configurations";
import AdminProfessionals from "@/pages/admin/Professionals";
import AdminAppointments from "@/pages/admin/Appointments";
import AdminFinancial from "@/pages/admin/Financial";
import AdminRoles from "@/pages/admin/Roles";
import BlogManagement from "@/pages/admin/BlogManagement";
import BlogEditor from "@/pages/admin/BlogEditor";
import PostAnalytics from "@/pages/admin/PostAnalytics";
import BlogAnalytics from "@/pages/admin/BlogAnalytics";
import BlogCuration from "@/pages/admin/BlogCuration";
import AdminTenants from "@/pages/admin/Tenants";
import AdminInstitutions from "@/pages/admin/Institutions";
import AdminSystemMaintenance from "@/pages/admin/SystemMaintenance";
import BulkImport from "@/pages/admin/BulkImport";
import AdminTests from "@/pages/admin/Tests";
import GoogleCalendarTests from "@/pages/admin/GoogleCalendarTests";
import GroupSessionsAdmin from "@/pages/admin/GroupSessionsAdmin";
import DemoData from "@/pages/admin/DemoData";
import AIManagement from "@/pages/admin/AIManagement";
import AdminInstitutionPortal from "@/pages/admin/AdminInstitutionPortal";

import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Componente separado para ThemeProvider com tenant
const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { tenant } = useTenant();
  const [storageKey, setStorageKey] = useState("alopsi-theme");

  useEffect(() => {
    if (tenant?.slug) {
      setStorageKey(`${tenant.slug}-theme`);
    }
  }, [tenant?.slug]);

  return (
    <ThemeProvider defaultTheme="light" storageKey={storageKey}>
      {children}
    </ThemeProvider>
  );
};

const AppWithShortcuts = () => {
  useGlobalCacheShortcut();
  
  return (
    <ThemeWrapper>
      <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/sobre" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/profissionais" element={<Professionals />} />
      <Route path="/profissional/:id" element={<Professional />} />
      <Route path="/professional/:id" element={<Professional />} />
      <Route path="/agendar" element={<Schedule />} />
      <Route path="/agendamento" element={<Appointment />} />
      <Route path="/agendamento/:token" element={<AppointmentAccess />} />
      <Route path="/confirmacao-agendamento" element={<BookingConfirmation />} />
      <Route path="/pagamento-sucesso" element={<PaymentSuccess />} />
      <Route path="/pagamento-cancelado" element={<PaymentCancelled />} />
      <Route path="/contato" element={<Contact />} />
      <Route path="/trabalhe-conosco" element={<WorkWithUs />} />
      <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
      <Route path="/termos-servico" element={<TermsOfService />} />
      <Route path="/perfil" element={<Profile />} />
      <Route path="/professional-profile" element={<ProfessionalProfile />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth-callback" element={<AuthCallback />} />
      <Route path="/google-calendar-callback" element={<GoogleCalendarCallback />} />
      
      {/* Redirect old routes to new cadastro routes */}
      <Route path="/registrar" element={<UserType />} />
      <Route path="/registrar/paciente" element={<PatientForm />} />
      <Route path="/registrar/profissional" element={<ProfessionalForm />} />
      
      {/* New standardized cadastro routes */}
      <Route path="/cadastro/tipo-usuario" element={<UserType />} />
      <Route path="/cadastro/paciente" element={<PatientForm />} />
      <Route path="/cadastro/profissional" element={<ProfessionalForm />} />
      
      {/* Rotas de Agendamentos */}
      <Route path="/agendamentos" element={<MyAppointments />} />
      <Route path="/reagendar/:appointmentId" element={<RescheduleAppointment />} />
      
      {/* Rotas do Diário Emocional */}
      <Route path="/diario-emocional" element={<MoodDiary />} />
      <Route path="/diario-emocional/experiencia" element={<MoodExperience />} />
      <Route path="/diario-emocional/nova-entrada" element={<MoodEntry />} />
      <Route path="/diario-emocional/historico" element={<MoodHistory />} />
      <Route path="/diario-emocional/analises" element={<MoodAnalytics />} />
      <Route path="/diario-emocional/configurar" element={<EmotionConfigPage />} />
      
      {/* Rotas de Encontros em Grupo */}
      <Route path="/encontros" element={<GroupSessions />} />
      <Route path="/encontros/:sessionId" element={<GroupSessionDetail />} />
      <Route path="/meus-encontros" element={<MyGroupSessions />} />
      <Route path="/gerenciar-encontros" element={<ProtectedRoute requiredRole="facilitator"><ManageGroupSessions /></ProtectedRoute>} />
      
      {/* Rotas Medcos (duplicadas com prefixo /medcos) */}
      <Route path="/medcos" element={<Index />} />
      <Route path="/medcos/sobre" element={<About />} />
      <Route path="/medcos/blog" element={<Blog />} />
      <Route path="/medcos/blog/:slug" element={<BlogPost />} />
      <Route path="/medcos/profissionais" element={<Professionals />} />
      <Route path="/medcos/profissional/:id" element={<Professional />} />
      <Route path="/medcos/agendar" element={<Schedule />} />
      <Route path="/medcos/agendamento" element={<Appointment />} />
      <Route path="/medcos/contato" element={<Contact />} />
      <Route path="/medcos/trabalhe-conosco" element={<WorkWithUs />} />
      
      {/* Rotas de cadastro Medcos */}
      <Route path="/medcos/cadastro/tipo-usuario" element={<UserType />} />
      <Route path="/medcos/cadastro/paciente" element={<PatientForm />} />
      <Route path="/medcos/cadastro/profissional" element={<ProfessionalForm />} />
      
      {/* Rotas de diário emocional Medcos */}
      <Route path="/medcos/diario-emocional" element={<MoodDiary />} />
      <Route path="/medcos/diario-emocional/experiencia" element={<MoodExperience />} />
      <Route path="/medcos/diario-emocional/nova-entrada" element={<MoodEntry />} />
      <Route path="/medcos/diario-emocional/historico" element={<MoodHistory />} />
      <Route path="/medcos/diario-emocional/analises" element={<MoodAnalytics />} />
      <Route path="/medcos/diario-emocional/configurar" element={<EmotionConfigPage />} />
      
      {/* Rotas de Encontros Medcos */}
      <Route path="/medcos/encontros" element={<GroupSessions />} />
      <Route path="/medcos/encontros/:sessionId" element={<GroupSessionDetail />} />
      <Route path="/medcos/meus-encontros" element={<MyGroupSessions />} />
      <Route path="/medcos/gerenciar-encontros" element={<ProtectedRoute requiredRole="facilitator"><ManageGroupSessions /></ProtectedRoute>} />
      
      {/* Rotas do Portal Institucional */}
      <Route 
        path="/portal-institucional" 
        element={
          <ProtectedRoute requiredRole="institution_admin">
            <InstitutionPortal />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/portal-institucional/profissionais" 
        element={
          <ProtectedRoute requiredRole="institution_admin">
            <InstitutionProfessionals />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/portal-institucional/alunos" 
        element={
          <ProtectedRoute requiredRole="institution_admin">
            <InstitutionStudents />
          </ProtectedRoute>
        } 
      />
      
      {/* Rotas de autenticação e perfil Medcos */}
      <Route path="/medcos/auth" element={<Auth />} />
      <Route path="/medcos/auth/callback" element={<AuthCallback />} />
      <Route path="/medcos/perfil" element={<Profile />} />
      <Route path="/medcos/professional-profile" element={<ProfessionalProfile />} />
      <Route path="/medcos/agendamentos" element={<MyAppointments />} />
      <Route path="/medcos/reagendar/:appointmentId" element={<RescheduleAppointment />} />

      {/* Rotas de agendamento e pagamento Medcos */}
      <Route path="/medcos/agendamento/:token" element={<AppointmentAccess />} />
      <Route path="/medcos/confirmacao-agendamento" element={<BookingConfirmation />} />
      <Route path="/medcos/pagamento-sucesso" element={<PaymentSuccess />} />
      <Route path="/medcos/pagamento-cancelado" element={<PaymentCancelled />} />

      {/* Rotas legais Medcos */}
      <Route path="/medcos/politica-privacidade" element={<PrivacyPolicy />} />
      <Route path="/medcos/termos-servico" element={<TermsOfService />} />
      
      {/* Rotas do Portal Institucional Medcos */}
      <Route 
        path="/medcos/portal-institucional" 
        element={
          <ProtectedRoute requiredRole="institution_admin">
            <InstitutionPortal />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/medcos/portal-institucional/profissionais" 
        element={
          <ProtectedRoute requiredRole="institution_admin">
            <InstitutionProfessionals />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/medcos/portal-institucional/alunos" 
        element={
          <ProtectedRoute requiredRole="institution_admin">
            <InstitutionStudents />
          </ProtectedRoute>
        } 
      />
      
      {/* Rotas Admin - Todas compartilham o mesmo AdminLayout */}
      <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/analytics" element={<AdminLayout><AdminAnalytics /></AdminLayout>} />
      <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
      <Route path="/admin/configuracoes" element={<AdminLayout><AdminConfigurations /></AdminLayout>} />
      <Route path="/admin/professionals" element={<AdminLayout><AdminProfessionals /></AdminLayout>} />
      <Route path="/admin/appointments" element={<AdminLayout><AdminAppointments /></AdminLayout>} />
      <Route path="/admin/financial" element={<AdminLayout><AdminFinancial /></AdminLayout>} />
      <Route path="/admin/roles" element={<AdminLayout><AdminRoles /></AdminLayout>} />
      <Route path="/admin/tenants" element={<AdminLayout><AdminTenants /></AdminLayout>} />
      <Route path="/admin/instituicoes" element={<AdminLayout><AdminInstitutions /></AdminLayout>} />
      <Route path="/admin/portal-institucional" element={<AdminLayout><AdminInstitutionPortal /></AdminLayout>} />
      <Route path="/admin/bulk-import" element={<AdminLayout><BulkImport /></AdminLayout>} />
      <Route path="/admin/system" element={<AdminLayout><AdminSystemMaintenance /></AdminLayout>} />
      <Route path="/admin/encontros" element={<AdminLayout><GroupSessionsAdmin /></AdminLayout>} />
      <Route path="/admin/tests" element={<AdminLayout><AdminTests /></AdminLayout>} />
      <Route path="/admin/demo-data" element={<AdminLayout><DemoData /></AdminLayout>} />
      <Route 
        path="/admin/ai-management" 
        element={
          <ProtectedRoute requiredRole="super_admin">
            <AdminLayout>
              <AIManagement />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route
        path="/admin/google-calendar-tests" 
        element={
          <ProtectedRoute requiredRole="super_admin">
            <AdminLayout>
              <GoogleCalendarTests />
            </AdminLayout>
          </ProtectedRoute>
        } 
      />

      <Route path="/admin/blog" element={<BlogLayout><BlogManagement /></BlogLayout>} />
      <Route path="/admin/blog/curation" element={<BlogLayout><BlogCuration /></BlogLayout>} />
      <Route path="/admin/blog-analytics" element={<BlogLayout><BlogAnalytics /></BlogLayout>} />
      <Route path="/admin/post-analytics/:postId" element={<BlogLayout><PostAnalytics /></BlogLayout>} />
      <Route path="/admin/blog/new" element={<BlogEditor />} />
      <Route path="/admin/blog/edit/:id" element={<BlogEditor />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
    </ThemeWrapper>
  );
};

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <TenantProvider>
              <AuthProvider>
                <TenantGuard>
                  <DomainRedirect />
                </TenantGuard>
                <FirstLoginWelcome />
                <AppWithShortcuts />
                <WhatsAppFloat />
                <ScrollToTopButton />
              </AuthProvider>
            </TenantProvider>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;