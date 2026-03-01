import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { PrivateRoute } from "@/components/common/PrivateRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Login } from "@/components/auth/Login";
import { Register } from "@/components/auth/Register";
import { ForgotPassword } from "@/components/auth/ForgotPassword";
import { ResetPassword } from "@/components/auth/ResetPassword";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Profile } from "@/components/profile/Profile";
import { AppointmentList } from "@/components/appointments/AppointmentList";
import { AppointmentDetail } from "@/components/appointments/AppointmentDetail";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { DoctorList } from "@/components/doctors/DoctorList";
import { DepartmentList } from "@/components/departments/DepartmentList";
import { PatientList } from "@/components/patients/PatientList";
import { PatientForm } from "@/components/patients/PatientForm";
import { PatientDetail } from "@/components/patients/PatientDetail";
import { DoctorForm } from "@/components/doctors/DoctorForm";
import { PrescriptionList } from "@/components/records/PrescriptionList";
import { PrescriptionDetail } from "@/components/records/PrescriptionDetail";
import { MedicalReportPrint } from "@/components/records/MedicalReportPrint";
import { BedDashboard } from "@/components/beds/BedDashboard";
import { BillingList } from "@/components/billing/BillingList";
import { BillingDetail } from "@/components/billing/BillingDetail";
import { BillingForm } from "@/components/billing/BillingForm";
import { InvoicePrint } from "@/components/billing/InvoicePrint";
import { NotificationList } from "@/components/notifications/NotificationList";
import { SupportList } from "@/components/support/SupportList";
import NotFound from "./pages/NotFound";
import { doctorService } from "@/services/doctorService";
import { patientService } from "@/services/patientService";

const queryClient = new QueryClient();

// Component wrapper for appointment form with modal behavior
const AppointmentFormWrapper = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Book Appointment</h1>
      </div>
      <div className="glass-card rounded-2xl p-8">
        <AppointmentForm
          onSuccess={() => navigate('/appointments')}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

// Component wrapper for patient form
const PatientFormWrapper = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Add New Patient</h1>
      </div>
      <div className="glass-card rounded-2xl p-8">
        <PatientForm
          onSuccess={() => navigate('/patients')}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

// Component wrapper for editing patient
const PatientEditWrapper = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      try {
        const data = await patientService.getById(parseInt(id));
        setInitialData(data);
      } catch (error) {
        console.error('Failed to fetch patient:', error);
        navigate('/patients');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatient();
  }, [id, navigate]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Edit Patient</h1>
      </div>
      <div className="glass-card rounded-2xl p-8">
        <PatientForm
          initialData={initialData}
          onSuccess={() => navigate('/patients')}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

// Component wrapper for doctor form
const DoctorFormWrapper = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const depts = await doctorService.getDepartments();
        setDepartments(depts);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepts();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Add New Doctor</h1>
      </div>
      <div className="glass-card rounded-2xl p-8">
        <DoctorForm
          departments={departments}
          onSuccess={() => navigate('/doctors')}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes with Layout */}
            <Route element={<PrivateRoute><DashboardLayout title="Dashboard" /></PrivateRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route element={<PrivateRoute><DashboardLayout title="My Profile" /></PrivateRoute>}>
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Appointments Routes */}
            <Route element={<PrivateRoute><DashboardLayout title="Appointments" /></PrivateRoute>}>
              <Route path="/appointments" element={<AppointmentList />} />
              <Route path="/appointments/:id" element={<AppointmentDetail />} />
            </Route>
            <Route element={<PrivateRoute><DashboardLayout title="Book Appointment" /></PrivateRoute>}>
              <Route path="/appointments/new" element={<AppointmentFormWrapper />} />
            </Route>

            {/* Doctors Routes */}
            <Route element={<PrivateRoute><DashboardLayout title="Doctors" /></PrivateRoute>}>
              <Route path="/doctors" element={<DoctorList />} />
            </Route>
            <Route element={<PrivateRoute><DashboardLayout title="Add Doctor" /></PrivateRoute>}>
              <Route path="/doctors/new" element={<DoctorFormWrapper />} />
            </Route>

            {/* Departments Routes */}
            <Route element={<PrivateRoute><DashboardLayout title="Departments" /></PrivateRoute>}>
              <Route path="/departments" element={<DepartmentList />} />
            </Route>

            {/* Patients Routes */}
            <Route element={<PrivateRoute><DashboardLayout title="Patients" /></PrivateRoute>}>
              <Route path="/patients" element={<PatientList />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/patients/:id/edit" element={<PatientEditWrapper />} />
            </Route>
            <Route element={<PrivateRoute><DashboardLayout title="Add Patient" /></PrivateRoute>}>
              <Route path="/patients/new" element={<PatientFormWrapper />} />
            </Route>

            {/* Records Route */}
            <Route element={<PrivateRoute><DashboardLayout title="Medical Records" /></PrivateRoute>}>
              <Route path="/records" element={<PrescriptionList />} />
              <Route path="/records/:id" element={<PrescriptionDetail />} />
            </Route>

            {/* Billing Routes */}
            <Route element={<PrivateRoute><DashboardLayout title="Billing" /></PrivateRoute>}>
              <Route path="/billing" element={<BillingList />} />
              <Route path="/billing/:id" element={<BillingDetail />} />
            </Route>
            <Route element={<PrivateRoute><DashboardLayout title="Create Invoice" /></PrivateRoute>}>
              <Route path="/billing/create" element={<BillingForm />} />
            </Route>

            {/* Print Routes - No Layout */}
            <Route path="/billing/invoice/:id" element={
              <PrivateRoute>
                <InvoicePrint />
              </PrivateRoute>
            } />
            <Route path="/records/prescription/:id/print" element={
              <PrivateRoute>
                <MedicalReportPrint />
              </PrivateRoute>
            } />

            {/* Notifications Route */}
            <Route element={<PrivateRoute><DashboardLayout title="Notifications" /></PrivateRoute>}>
              <Route path="/notifications" element={<NotificationList />} />
            </Route>

            {/* Support Route */}
            <Route element={<PrivateRoute><DashboardLayout title="Support" /></PrivateRoute>}>
              <Route path="/support" element={<SupportList />} />
            </Route>

            {/* Bed Management Route */}
            <Route element={<PrivateRoute><DashboardLayout title="Bed Management" /></PrivateRoute>}>
              <Route path="/beds" element={<BedDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
