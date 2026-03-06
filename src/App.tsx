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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
