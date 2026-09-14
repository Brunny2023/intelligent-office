import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ExecutionModule from "./pages/ExecutionModule";
import MessagesModule from "./pages/MessagesModule";
import MeetingsModule from "./pages/MeetingsModule";
import DocumentsModule from "./pages/DocumentsModule";
import AIInsightsModule from "./pages/AIInsightsModule";
import WorkflowsModule from "./pages/WorkflowsModule";
import TeamModule from "./pages/TeamModule";
import SettingsModule from "./pages/SettingsModule";
import FeaturesPage from "./pages/FeaturesPage";
import Demo from "./pages/Demo";
import ExecMeetingRoom from "./pages/ExecMeetingRoom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/execution" element={<ProtectedRoute><ExecutionModule /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesModule /></ProtectedRoute>} />
            <Route path="/meetings" element={<ProtectedRoute><MeetingsModule /></ProtectedRoute>} />
            <Route path="/meetings/:roomName" element={<ProtectedRoute><MeetingsModule /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DocumentsModule /></ProtectedRoute>} />
            <Route path="/ai-insights" element={<ProtectedRoute><AIInsightsModule /></ProtectedRoute>} />
            <Route path="/workflows" element={<ProtectedRoute><WorkflowsModule /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><TeamModule /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsModule /></ProtectedRoute>} />
            <Route path="/exec-room/:roomName" element={<ExecMeetingRoom />} />
            <Route path="/m/:code" element={<ExecMeetingRoom />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
