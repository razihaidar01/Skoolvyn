import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import OtpLoginPage from "./pages/auth/OtpLoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import InstitutionAdminDashboard from "./pages/InstitutionAdminDashboard";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import AccountRejectedPage from "./pages/AccountRejectedPage";
import AccountSuspendedPage from "./pages/AccountSuspendedPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
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
            {/* Public routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/otp-login" element={<OtpLoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Approval status pages (need auth) */}
            <Route path="/pending-approval" element={<ProtectedRoute><PendingApprovalPage /></ProtectedRoute>} />
            <Route path="/account-rejected" element={<ProtectedRoute><AccountRejectedPage /></ProtectedRoute>} />
            <Route path="/account-suspended" element={<ProtectedRoute><AccountSuspendedPage /></ProtectedRoute>} />

            {/* Super Admin Dashboard */}
            <Route path="/super-admin/dashboard" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/approvals" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/institutions" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/subscriptions" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/announcements" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/settings" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />

            {/* Other protected routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/academic" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students/new" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students/:id" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students/:id/edit" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/examinations" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['accountant', 'institution_admin']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/library" element={<ProtectedRoute allowedRoles={['librarian', 'institution_admin']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/hostel" element={<ProtectedRoute allowedRoles={['hostel_warden', 'institution_admin']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/transport" element={<ProtectedRoute allowedRoles={['transport_manager', 'institution_admin']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
