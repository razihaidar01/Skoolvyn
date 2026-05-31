import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Code-split route components so the initial bundle stays small.
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const OtpLoginPage = lazy(() => import("./pages/auth/OtpLoginPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const StudentPortal = lazy(() => import("./pages/StudentPortal"));
const ParentPortal = lazy(() => import("./pages/ParentPortal"));
const FacultyPortal = lazy(() => import("./pages/FacultyPortal"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const InstitutionAdminDashboard = lazy(() => import("./pages/InstitutionAdminDashboard"));
const PendingApprovalPage = lazy(() => import("./pages/PendingApprovalPage"));
const AccountRejectedPage = lazy(() => import("./pages/AccountRejectedPage"));
const AccountSuspendedPage = lazy(() => import("./pages/AccountSuspendedPage"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HomePage = lazy(() => import("./pages/landing/HomePage"));
const FeaturesPage = lazy(() => import("./pages/landing/FeaturesPage"));
const PricingPage = lazy(() => import("./pages/landing/PricingPage"));
const FaqPage = lazy(() => import("./pages/landing/FaqPage"));
const AboutPage = lazy(() => import("./pages/landing/AboutPage"));
const ContactPage = lazy(() => import("./pages/landing/ContactPage"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public landing pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/otp-login" element={<OtpLoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            {/* Approval status pages */}
            <Route path="/pending-approval" element={<ProtectedRoute><PendingApprovalPage /></ProtectedRoute>} />
            <Route path="/account-rejected" element={<ProtectedRoute><AccountRejectedPage /></ProtectedRoute>} />
            <Route path="/account-suspended" element={<ProtectedRoute><AccountSuspendedPage /></ProtectedRoute>} />

            {/* Super Admin */}
            <Route path="/super-admin/dashboard" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/approvals" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/institutions" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/subscriptions" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/announcements" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/settings" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />

            {/* Institution Admin — Core */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod', 'hr_manager', 'faculty', 'accountant', 'librarian', 'hostel_warden', 'transport_manager']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/academic" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />

            {/* Students */}
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod', 'faculty']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students/new" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students/:id" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students/:id/edit" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod']}><InstitutionAdminDashboard /></ProtectedRoute>} />

            {/* Staff */}
            <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hr_manager']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/staff/new" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hr_manager']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/staff/:id" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hr_manager']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/staff/:id/edit" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hr_manager']}><InstitutionAdminDashboard /></ProtectedRoute>} />

            {/* Attendance */}
            <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod', 'faculty']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/attendance/report" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/attendance/:batchId" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod', 'faculty']}><InstitutionAdminDashboard /></ProtectedRoute>} />

            {/* Examinations */}
            <Route path="/admin/examinations" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod', 'faculty']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/examinations/report" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/examinations/:examId/marks" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod', 'faculty']}><InstitutionAdminDashboard /></ProtectedRoute>} />

            {/* Fees */}
            <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['institution_admin', 'accountant', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/fees/collect" element={<ProtectedRoute allowedRoles={['institution_admin', 'accountant', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/fees/structures" element={<ProtectedRoute allowedRoles={['institution_admin', 'accountant', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/fees/defaulters" element={<ProtectedRoute allowedRoles={['institution_admin', 'accountant', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />

            {/* Coming Soon Modules */}
            <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/library" element={<ProtectedRoute allowedRoles={['librarian', 'institution_admin']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/hostel" element={<ProtectedRoute allowedRoles={['hostel_warden', 'institution_admin']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/transport" element={<ProtectedRoute allowedRoles={['transport_manager', 'institution_admin']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/admissions" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/staff-attendance" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hr_manager']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/payroll" element={<ProtectedRoute allowedRoles={['institution_admin', 'hr_manager', 'accountant']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/accounts" element={<ProtectedRoute allowedRoles={['institution_admin', 'accountant', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hr_manager']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/visitors" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/certificates" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal', 'hod']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['institution_admin', 'principal']}><InstitutionAdminDashboard /></ProtectedRoute>} />

            {/* Role Dashboards */}
            <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyPortal /></ProtectedRoute>} />
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentPortal /></ProtectedRoute>} />
            <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentPortal /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;