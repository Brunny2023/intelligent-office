import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import AttendanceModule from "./pages/AttendanceModule";
import ActivityModule from "./pages/ActivityModule";
import ExecutionModule from "./pages/ExecutionModule";
import MessagesModule from "./pages/MessagesModule";
import MeetingsModule from "./pages/MeetingsModule";
import DocumentsModule from "./pages/DocumentsModule";
import KPIModule from "./pages/KPIModule";
import HRModule from "./pages/HRModule";
import FinanceModule from "./pages/FinanceModule";
import AnnouncementsModule from "./pages/AnnouncementsModule";
import AIInsightsModule from "./pages/AIInsightsModule";
import ExecutiveModule from "./pages/ExecutiveModule";
import WorkflowsModule from "./pages/WorkflowsModule";
import TeamModule from "./pages/TeamModule";
import SecurityModule from "./pages/SecurityModule";
import JobPlanningModule from "./pages/JobPlanningModule";
import GraphExplorer from "./pages/GraphExplorer";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdmin from "./pages/SuperAdmin";
import SupportModule from "./pages/SupportModule";
import SupportTicketDetail from "./pages/SupportTicketDetail";
import SettingsModule from "./pages/SettingsModule";
import FeaturesPage from "./pages/FeaturesPage";
import InterOrgModule from "./pages/InterOrgModule";
import Demo from "./pages/Demo";
import Investors from "./pages/Investors";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><AttendanceModule /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><ActivityModule /></ProtectedRoute>} />
            <Route path="/execution" element={<ProtectedRoute><ExecutionModule /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesModule /></ProtectedRoute>} />
            <Route path="/meetings" element={<ProtectedRoute><MeetingsModule /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DocumentsModule /></ProtectedRoute>} />
            <Route path="/intelligence" element={<ProtectedRoute><KPIModule /></ProtectedRoute>} />
            <Route path="/hr" element={<ProtectedRoute><HRModule /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><FinanceModule /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><AnnouncementsModule /></ProtectedRoute>} />
            <Route path="/ai-insights" element={<ProtectedRoute><AIInsightsModule /></ProtectedRoute>} />
            <Route path="/executive" element={<ProtectedRoute><ExecutiveModule /></ProtectedRoute>} />
            <Route path="/workflows" element={<ProtectedRoute><WorkflowsModule /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><TeamModule /></ProtectedRoute>} />
            <Route path="/security" element={<ProtectedRoute><SecurityModule /></ProtectedRoute>} />
            <Route path="/job-planning" element={<ProtectedRoute><JobPlanningModule /></ProtectedRoute>} />
            <Route path="/intelligence/graph" element={<ProtectedRoute><GraphExplorer /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsModule /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><SupportModule /></ProtectedRoute>} />
            <Route path="/support/:id" element={<ProtectedRoute><SupportTicketDetail /></ProtectedRoute>} />
            <Route path="/partner-connect" element={<ProtectedRoute><InterOrgModule /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
