import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  Calendar,
  ArrowRight,
  Plus,
  AlertCircle,
  BedDouble,
  Wallet,
  Activity,
  FileText,
  Clock,
  ClipboardList
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { PageLoader } from '@/components/common/Loader';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { billingService } from '@/services/billingService';
import { bedService } from '@/services/bedService';
import { formatDate, formatTime, capitalizeFirst, formatCurrency } from '@/utils/helpers';
import { ROLES } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { isSameDay, parseISO, subDays, format } from 'date-fns';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointmentsToday: 0,
    availableBeds: 0,
    revenue: 0,
    totalBeds: 0,
    // Patient/Doctor specific stats
    myAppointments: 0,
    upcomingAppointment: null as Appointment | null,
    pendingBills: 0,
    myPatients: 0,
    totalAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [bedOccupancyData, setBedOccupancyData] = useState<any[]>([]);
  const [patientFlowData, setPatientFlowData] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const isPatient = user?.role === ROLES.PATIENT;
  const isDoctor = user?.role === ROLES.DOCTOR;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isPatient) {
          // Patient View Data Fetching
          const [appointments, doctorsList] = await Promise.all([
            appointmentService.getAll(),
            doctorService.getAll(),
          ]);

          const appointmentsList = Array.isArray(appointments) ? appointments : [];
          // Sort by date descending for list
          const sortedAppointments = [...appointmentsList].sort((a, b) =>
            new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
          );

          // Find upcoming appointment
          const now = new Date();
          const upcoming = appointmentsList
            .filter(a => new Date(a.appointment_date) >= now)
            .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())[0];

          setStats({
            ...stats,
            myAppointments: appointmentsList.length,
            upcomingAppointment: upcoming || null,
            doctors: Array.isArray(doctorsList) ? doctorsList.length : 0,
          });

          setRecentAppointments(sortedAppointments.slice(0, 5));
          setDoctors(Array.isArray(doctorsList) ? doctorsList : []);

        } else if (isDoctor) {
          // Doctor View Data Fetching
          const [appointments] = await Promise.all([
            appointmentService.getAll(),
          ]);

          const allAppointments = Array.isArray(appointments) ? appointments : [];

          // Filter for this doctor
          // Note: user.doctor_id comes from our updated UserSerializer
          const myAppointments = user?.doctor_id
            ? allAppointments.filter(a => a.doctor === user.doctor_id)
            : [];

          const today = new Date();
          const appointmentsToday = myAppointments.filter(a =>
            isSameDay(parseISO(a.appointment_date), today)
          ).length;

          // Unique patients count
          const uniquePatients = new Set(myAppointments.map(a => a.patient)).size;

          const sortedAppointments = [...myAppointments].sort((a, b) =>
            new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
          );

          const now = new Date();
          const upcoming = myAppointments
            .filter(a => new Date(a.appointment_date) >= now)
            .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())[0];

          setStats({
            ...stats,
            appointmentsToday, // Today's appointments for this doctor
            totalAppointments: myAppointments.length, // Total all time
            myPatients: uniquePatients,
            upcomingAppointment: upcoming || null,
          });

          setRecentAppointments(sortedAppointments.slice(0, 5));

          // Calculate patient flow for this doctor
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(today, 6 - i);
            return {
              name: format(d, 'EEE'),
              date: d,
              patients: 0,
              emergency: 0
            };
          });

          myAppointments.forEach(apt => {
            const aptDate = parseISO(apt.appointment_date);
            const dayStat = last7Days.find(d => isSameDay(d.date, aptDate));
            if (dayStat) {
              dayStat.patients += 1;
            }
          });
          setPatientFlowData(last7Days);

        } else {
          // Admin/Staff View Data Fetching
          const [appointments, patients, doctors, bills, beds] = await Promise.all([
            appointmentService.getAll(),
            patientService.getAll(),
            doctorService.getAll(),
            billingService.getAll(),
            bedService.getBeds(),
          ]);

          const appointmentsList = Array.isArray(appointments) ? appointments : [];
          const patientsList = Array.isArray(patients) ? patients : [];
          const doctorsList = Array.isArray(doctors) ? doctors : [];
          const billsList = Array.isArray(bills) ? bills : [];
          const bedsList = Array.isArray(beds) ? beds : [];

          // Stats Calculation
          const today = new Date();
          const appointmentsToday = appointmentsList.filter((a: any) =>
            isSameDay(parseISO(a.appointment_date), today)
          ).length;

          const totalRevenue = billsList.reduce((sum: number, bill: any) =>
            sum + (Number(bill.paid_amount) || 0), 0
          );

          const availableBeds = bedsList.filter((b: any) => b.status === 'AVAILABLE').length;
          const totalBeds = bedsList.length;
          const occupiedBeds = totalBeds - availableBeds;

          setStats({
            patients: patientsList.length,
            doctors: doctorsList.length,
            appointmentsToday,
            availableBeds,
            revenue: totalRevenue,
            totalBeds,
            myAppointments: 0,
            upcomingAppointment: null,
            pendingBills: 0,
            myPatients: 0,
            totalAppointments: appointmentsList.length,
          });

          // Charts Data
          setBedOccupancyData([
            { name: 'Occupied', value: occupiedBeds, color: '#ef4444' }, // Red
            { name: 'Available', value: availableBeds, color: '#10b981' }, // Green
          ]);

          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(today, 6 - i);
            return {
              name: format(d, 'EEE'),
              date: d,
              patients: 0,
              emergency: 0
            };
          });

          appointmentsList.forEach((apt: any) => {
            const aptDate = parseISO(apt.appointment_date);
            const dayStat = last7Days.find(d => isSameDay(d.date, aptDate));
            if (dayStat) {
              dayStat.patients += 1;
            }
          });

          setPatientFlowData(last7Days);
          setRecentAppointments(appointmentsList.slice(0, 5));
          setDoctors(doctorsList);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, isPatient, isDoctor]);

  if (isLoading) return <PageLoader />;

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      PENDING: 'bg-orange-100 text-orange-700',
      APPROVED: 'bg-emerald-100 text-emerald-700',
      CANCELLED: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-blue-100 text-blue-700',
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  };

  // --- Patient Dashboard View ---
  if (isPatient) {
    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Breadcrumbs />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Patient Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.first_name || 'Patient'}!</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/appointments/new')}
              className="btn-gradient flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Patient Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <StatCard
            title="My Appointments"
            value={stats.myAppointments.toString()}
            icon={Calendar}
            variant="blue"
          />
          <StatCard
            title="Available Doctors"
            value={stats.doctors.toString()}
            icon={Stethoscope}
            variant="green"
          />
          <StatCard
            title="Next Visit"
            value={stats.upcomingAppointment ? formatDate(stats.upcomingAppointment.appointment_date) : 'No upcoming visits'}
            icon={Clock}
            variant={stats.upcomingAppointment ? 'purple' : 'gray'}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {/* My Appointments List */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">My Appointments History</h3>
                <p className="text-sm text-muted-foreground">Your recent interactions</p>
              </div>
              <button onClick={() => navigate('/appointments')} className="text-sm text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-6 py-3 text-muted-foreground font-medium">Doctor</th>
                    <th className="px-6 py-3 text-muted-foreground font-medium">Date & Time</th>
                    <th className="px-6 py-3 text-muted-foreground font-medium">Reason</th>
                    <th className="px-6 py-3 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentAppointments.length > 0 ? (
                    recentAppointments.map((apt) => (
                      <tr
                        key={apt.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium">Dr. {apt.doctor_name || 'Unassigned'}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          <div className="flex flex-col">
                            <span>{formatDate(apt.appointment_date)}</span>
                            <span className="text-xs opacity-70">{formatTime(apt.appointment_time)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground truncate max-w-[150px]">{apt.reason}</td>
                        <td className="px-6 py-4">
                          <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusBadgeClass(apt.status))}>
                            {capitalizeFirst(apt.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">You haven't booked any appointments yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions / Info */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-500" />
                Health Tips
              </h3>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-sm text-orange-800 space-y-2">
                <p>✨ <strong>Stay Hydrated:</strong> Drink at least 8 glasses of water daily.</p>
                <p>🏃 <strong>Exercise:</strong> 30 minutes of walking improves heart health.</p>
                <p>🍎 <strong>Eat Healthy:</strong> Prioritize fruits and vegetables.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Recent Reports
              </h3>
              <p className="text-sm text-muted-foreground mb-4">No new medical reports available.</p>
              <button className="w-full py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium cursor-not-allowed">View All Records</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Doctor Dashboard View ---
  if (isDoctor) {
    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Breadcrumbs />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Doctor Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Dr. {user?.last_name || user?.first_name}!</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Doctor specific actions if needed */}
          </div>
        </div>

        {/* Doctor Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <StatCard
            title="Today's Appointments"
            value={stats.appointmentsToday.toString()}
            icon={Calendar}
            variant="purple"
          />
          <StatCard
            title="Total Patients Seen"
            value={stats.myPatients.toString()}
            icon={Users}
            variant="blue"
          />
          <StatCard
            title="Total Appointments"
            value={stats.totalAppointments.toString()}
            icon={ClipboardList}
            variant="orange"
          />
          <StatCard
            title="Next Appointment"
            value={stats.upcomingAppointment ? formatTime(stats.upcomingAppointment.appointment_time) : 'None'}
            icon={Clock}
            variant={stats.upcomingAppointment ? "green" : "gray"}
          />
        </div>

        {/* Doctor Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>

          {/* Patient Flow Chart (Specific to Doctor) */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg text-foreground">My Appointments (Last 7 Days)</h3>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patientFlowData}>
                  <defs>
                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="patients" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorPatients)" name="Appointments" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions / Schedule Preview? */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col">
            <h3 className="font-semibold text-lg mb-4">Next Patient</h3>
            {stats.upcomingAppointment ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-muted/30 rounded-xl border border-border">
                  <p className="text-sm text-muted-foreground">Patient Name</p>
                  <p className="font-medium text-lg">{stats.upcomingAppointment.patient_name || 'Unknown'}</p>
                  <div className="mt-2 flex gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-medium">{formatTime(stats.upcomingAppointment.appointment_time)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(stats.upcomingAppointment.appointment_date)}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/appointments/${stats.upcomingAppointment?.id}`)}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  View Details
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No upcoming appointments scheduled.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Appointments for Doctor */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">My Recent Appointments</h3>
              <p className="text-sm text-muted-foreground">Latest scheduled visits</p>
            </div>
            <button onClick={() => navigate('/appointments')} className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-6 py-3 text-muted-foreground font-medium">Patient</th>
                  <th className="px-6 py-3 text-muted-foreground font-medium">Date & Time</th>
                  <th className="px-6 py-3 text-muted-foreground font-medium">Reason</th>
                  <th className="px-6 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="px-6 py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAppointments.length > 0 ? (
                  recentAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-medium group-hover:text-primary transition-colors">{apt.patient_name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{formatDate(apt.appointment_date)}</span>
                          <span className="text-xs opacity-70">{formatTime(apt.appointment_time)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground truncate max-w-[150px]">{apt.reason}</td>
                      <td className="px-6 py-4">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusBadgeClass(apt.status))}>
                          {capitalizeFirst(apt.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors">
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No appointments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- Admin/Staff Dashboard View ---
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Hospital Overview & Analytics</p>
        </div>
        <div className="flex items-center gap-3">

        </div>
      </div>

      {/* Critical Alerts Banner */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-4 animate-slide-up">
        <div className="p-2 bg-red-100 rounded-full text-red-600 animate-pulse">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-red-900 font-semibold">System Status</h3>
          <p className="text-red-700 text-sm mt-1">
            {stats.availableBeds < 5
              ? `Critical: Low Bed Availability (${stats.availableBeds} remaining)`
              : 'All systems operational. monitored 24/7.'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.revenue)}
          icon={Wallet}
          variant="green"
          trend={{ value: 10, isPositive: true }}
        />
        <StatCard
          title="Appointments Today"
          value={stats.appointmentsToday.toLocaleString()}
          icon={Calendar}
          variant="purple"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Total Patients"
          value={stats.patients.toLocaleString()}
          icon={Users}
          variant="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Available Beds"
          value={`${stats.availableBeds} / ${stats.totalBeds}`}
          icon={BedDouble}
          variant="orange"
          trend={{ value: 2, isPositive: false }}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>

        {/* Patient Flow Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Patient Flow (Last 7 Days)</h3>
              <p className="text-sm text-muted-foreground">Daily appointment volume</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patientFlowData}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPatients)" name="Appointments" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bed Occupancy / Department */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <h3 className="font-semibold text-lg text-foreground mb-1">Bed Occupancy</h3>
          <p className="text-sm text-muted-foreground mb-6">Real-time bed status</p>

          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bedOccupancyData.length > 0 ? bedOccupancyData : [{ name: 'No Data', value: 1, color: '#eee' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(bedOccupancyData.length > 0 ? bedOccupancyData : [{ name: 'No Data', value: 1, color: '#eee' }]).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {stats.totalBeds > 0 ? Math.round(((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {bedOccupancyData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Appointments & Available Doctors */}
      <div className="grid gap-6 lg:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>

        {/* Recent Appointments Table */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Recent Appointments</h3>
              <p className="text-sm text-muted-foreground">Latest scheduled visits</p>
            </div>
            <button onClick={() => navigate('/appointments')} className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-6 py-3 text-muted-foreground font-medium">Patient</th>
                  <th className="px-6 py-3 text-muted-foreground font-medium">Doctor</th>
                  <th className="px-6 py-3 text-muted-foreground font-medium">Date & Time</th>
                  <th className="px-6 py-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAppointments.length > 0 ? (
                  recentAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-medium group-hover:text-primary transition-colors">{apt.patient_name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{apt.doctor_name || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{formatDate(apt.appointment_date)}</span>
                          <span className="text-xs opacity-70">{formatTime(apt.appointment_time)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusBadgeClass(apt.status))}>
                          {capitalizeFirst(apt.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No appointments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctors Section */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col">
          <h3 className="font-semibold text-lg mb-4">Doctor List</h3>
          <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
            {doctors.length > 0 ? (
              doctors.map((doc: any, i: number) => (
                <div key={doc.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {doc.user_name ? doc.user_name[0] : 'D'}
                    </div>
                    {(doc.is_available ?? true) && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">Dr. {doc.user_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{doc.department_name || doc.department?.name || 'General'} • {doc.specialization || 'Doctor'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No doctors found
              </div>
            )}

            <button
              onClick={() => navigate('/doctors')}
              className="w-full mt-2 py-2 text-sm text-center text-muted-foreground hover:text-foreground border border-dashed rounded-lg hover:bg-muted transition-colors"
            >
              View All Doctors
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
