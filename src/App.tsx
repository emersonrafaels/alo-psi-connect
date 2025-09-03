import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Professional from "./pages/Professional";
import Professionals from "./pages/Professionals";
import Schedule from "./pages/Schedule";
import BookingConfirmation from "./pages/BookingConfirmation";
import Contact from "./pages/Contact";
import WorkWithUs from "./pages/WorkWithUs";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import UserType from "./pages/register/UserType";
import PatientForm from "./pages/register/PatientForm";
import ProfessionalForm from "./pages/register/ProfessionalForm";
import NotFound from "./pages/NotFound";
import WhatsAppFloat from "@/components/ui/whatsapp-float";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="alopsi-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/profissionais" element={<Professionals />} />
            <Route path="/profissional/:id" element={<Professional />} />
            <Route path="/agendar" element={<Schedule />} />
            <Route path="/confirmacao-agendamento" element={<BookingConfirmation />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/trabalhe-conosco" element={<WorkWithUs />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/registrar" element={<UserType />} />
            <Route path="/registrar/paciente" element={<PatientForm />} />
            <Route path="/registrar/profissional" element={<ProfessionalForm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <WhatsAppFloat />
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
