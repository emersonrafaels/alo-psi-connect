import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import WhatsAppFloat from "@/components/ui/whatsapp-float";

// Pages
import Index from "./pages/Index";
import About from "./pages/About";
import Blog from "./pages/Blog";
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
import UserType from "./pages/register/UserType";
import PatientForm from "./pages/register/PatientForm";
import ProfessionalForm from "./pages/register/ProfessionalForm";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Appointment management pages
import MyAppointments from "./pages/MyAppointments";
import RescheduleAppointment from "./pages/RescheduleAppointment";

// Admin pages
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminUsers from "@/pages/admin/Users";

import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="alopsi-theme">
          <AuthProvider>
            <TooltipProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/sobre" element={<About />} />
                  <Route path="/blog" element={<Blog />} />
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
                  <Route path="/perfil" element={<Profile />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
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
                  
                  {/* Rotas Admin */}
                  <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
                  <Route path="/admin/analytics" element={<AdminLayout><AdminAnalytics /></AdminLayout>} />
                  <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <WhatsAppFloat />
              </BrowserRouter>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;