/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';
import {
  FiActivity as Activity,
  FiClock as Clock,
  FiFileText as FileText,
  FiCalendar as Calendar,
  FiSearch as Search,
  FiEye as Eye,
  FiUser as User,
  FiMail as Mail,
  FiPhone as Phone,
  FiMapPin as MapPin,
  FiHeart as Heart,
  FiShield as Shield,
  FiTrendingUp as TrendingUp,
  FiPackage as Package,
  FiDroplet as Droplet,
} from 'react-icons/fi';
import { formatDate, calculateAge, getAgeGroup } from '@/types/patient';

interface PatientData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nic: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  height?: number;
  weight?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  bmi?: number;
  bmiCategory?: string;
  age?: number;
}

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  type: string;
  status: string;
  reason: string;
  symptoms?: string;
  doctor: {
    _id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    specialization?: string;
    email?: string;
    phone?: string;
  };
}

interface MedicalRecord {
  _id: string;
  recordType: string;
  title: string;
  description: string;
  date: string;
  status: string;
  doctorNotes?: string;
  doctor?: {
    id: string;
    name: string;
    email: string;
    specialization?: string;
  };
}

interface Prescription {
  _id: string;
  diagnosis: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  status: string;
  startDate: string;
  endDate?: string;
  prescriptionNumber: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  estimatedDelivery?: string;
  items: Array<{
    product: {
      name: string;
      price: number;
    };
    quantity: number;
  }>;
}

interface DashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
  medicalRecordsCount: number;
  prescriptionsCount: number;
  ordersCount: number;
  activePrescriptions: number;
  lastCheckup?: string;
  nextAppointment?: string;
}

interface RecentActivity {
  id: string;
  type: 'appointment' | 'medical_record' | 'prescription' | 'order';
  title: string;
  date: string;
  status?: string;
  description?: string;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>(
    []
  );
  const [recentMedicalRecords, setRecentMedicalRecords] = useState<
    MedicalRecord[]
  >([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<
    Prescription[]
  >([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info',
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    cancelledAppointments: 0,
    medicalRecordsCount: 0,
    prescriptionsCount: 0,
    ordersCount: 0,
    activePrescriptions: 0,
  });
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'PATIENT') {
        router.push('/dashboard');
      } else {
        fetchDashboardData();
      }
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch patient profile
      const profileResponse = await fetch(
        `/api/patients/profile?userId=${session?.user?.id}`
      );
      const profileResult = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileResult.error || 'Failed to fetch profile');
      }

      const patientData = profileResult.data;
      setPatient(patientData);

      // Fetch appointments
      const appointmentsResponse = await fetch(
        `/api/appointments/patient?patientId=${patientData._id}`
      );
      const appointmentsResult = await appointmentsResponse.json();
      const appointments: Appointment[] = appointmentsResult.data || [];

      // Fetch medical records
      const medicalRecordsResponse = await fetch(
        `/api/records/patient?nic=${patientData.nic}`
      );
      const medicalRecordsResult = await medicalRecordsResponse.json();
      const medicalRecords: MedicalRecord[] = medicalRecordsResult.data || [];

      // Fetch prescriptions
      const prescriptionsResponse = await fetch(
        `/api/doctor/prescriptions/patient?nic=${patientData.nic}`
      );
      const prescriptionsResult = await prescriptionsResponse.json();
      const prescriptions: Prescription[] = prescriptionsResult.data || [];

      // Fetch orders
      const ordersResponse = await fetch(
        `/api/orders/my-order?nic=${patientData.nic}`
      );
      const ordersResult = await ordersResponse.json();
      const orders: Order[] = ordersResult.orders || [];

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingApps = appointments.filter(
        app =>
          new Date(app.appointmentDate) >= today &&
          app.status !== 'cancelled' &&
          app.status !== 'completed'
      );

      const calculatedStats: DashboardStats = {
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(
          app => app.status === 'completed'
        ).length,
        upcomingAppointments: upcomingApps.length,
        cancelledAppointments: appointments.filter(
          app => app.status === 'cancelled'
        ).length,
        medicalRecordsCount: medicalRecords.length,
        prescriptionsCount: prescriptions.length,
        ordersCount: orders.length,
        activePrescriptions: prescriptions.filter(p => p.status === 'ACTIVE')
          .length,
        lastCheckup: appointments
          .filter(app => app.status === 'completed')
          .sort(
            (a, b) =>
              new Date(b.appointmentDate).getTime() -
              new Date(a.appointmentDate).getTime()
          )[0]?.appointmentDate,
        nextAppointment: upcomingApps.sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime()
        )[0]?.appointmentDate,
      };

      setStats(calculatedStats);

      // Get recent appointments (last 5)
      const sortedAppointments = [...appointments]
        .sort(
          (a, b) =>
            new Date(b.appointmentDate).getTime() -
            new Date(a.appointmentDate).getTime()
        )
        .slice(0, 5);
      setRecentAppointments(sortedAppointments);

      // Get recent medical records (last 5)
      const sortedMedicalRecords = [...medicalRecords]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      setRecentMedicalRecords(sortedMedicalRecords);

      // Get recent prescriptions (last 5)
      const sortedPrescriptions = [...prescriptions]
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )
        .slice(0, 5);
      setRecentPrescriptions(sortedPrescriptions);

      // Get recent orders (last 5)
      const sortedOrders = [...orders]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);
      setRecentOrders(sortedOrders);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setToast({
        show: true,
        message: err.message || 'Failed to load dashboard data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCombinedActivities = (): RecentActivity[] => {
    const appointmentActivities: RecentActivity[] = recentAppointments.map(
      app => ({
        id: app._id,
        type: 'appointment',
        title: `Appointment with Dr. ${app.doctor?.name || 'Doctor'}`,
        date: app.appointmentDate,
        status: app.status,
        description: app.reason,
      })
    );

    const medicalActivities: RecentActivity[] = recentMedicalRecords.map(
      record => ({
        id: record._id,
        type: 'medical_record',
        title: record.title,
        date: record.date,
        status: record.status,
        description: record.description,
      })
    );

    const prescriptionActivities: RecentActivity[] = recentPrescriptions.map(
      prescription => ({
        id: prescription._id,
        type: 'prescription',
        title: `Prescription #${prescription.prescriptionNumber}`,
        date: prescription.startDate,
        status: prescription.status,
        description: prescription.diagnosis,
      })
    );

    const orderActivities: RecentActivity[] = recentOrders.map(order => ({
      id: order._id,
      type: 'order',
      title: `Order #${order.orderNumber}`,
      date: order.createdAt,
      status: order.status,
      description: `Total: $${order.totalAmount}`,
    }));

    let activities = [
      ...appointmentActivities,
      ...medicalActivities,
      ...prescriptionActivities,
      ...orderActivities,
    ];

    if (filterType !== 'all') {
      activities = activities.filter(activity => activity.type === filterType);
    }

    if (searchQuery) {
      activities = activities.filter(
        activity =>
          activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (activity.description?.toLowerCase() || '').includes(
            searchQuery.toLowerCase()
          )
      );
    }

    // Sort by date (most recent first)
    activities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return activities.slice(0, 10);
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      completed: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      resolved: 'bg-green-100 text-green-800',
      chronic: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      ACTIVE: 'bg-green-100 text-green-800',
    };
    return statusColors[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className='h-5 w-5 text-blue-600' />;
      case 'medical_record':
        return <FileText className='h-5 w-5 text-green-600' />;
      case 'prescription':
        return <Heart className='h-5 w-5 text-red-600' />;
      case 'order':
        return <Package className='h-5 w-5 text-purple-600' />;
      default:
        return <Activity className='h-5 w-5 text-gray-600' />;
    }
  };

  const getBMICategoryColor = (category?: string) => {
    switch (category) {
      case 'Underweight':
        return 'text-yellow-600';
      case 'Normal':
        return 'text-green-600';
      case 'Overweight':
        return 'text-orange-600';
      case 'Obese':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return <Loading />;
  }

  const age = patient?.dateOfBirth
    ? calculateAge(new Date(patient.dateOfBirth))
    : patient?.age || null;
  const ageGroup = patient?.dateOfBirth
    ? getAgeGroup(new Date(patient.dateOfBirth))
    : null;

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <h1 className='text-3xl font-bold text-gray-900'>
            Welcome back, {patient?.firstName || 'Patient'}!
          </h1>
          <p className='text-gray-600 mt-2'>
            Here&apos;s your health dashboard overview
          </p>
        </motion.div>

        {/* Patient Information Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='bg-white rounded-2xl shadow-xl mb-8 overflow-hidden'
        >
          <div className='bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4'>
            <h2 className='text-white text-xl font-semibold'>
              Patient Information
            </h2>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-100 rounded-full'>
                  <User className='h-5 w-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Full Name</p>
                  <p className='font-medium text-gray-900'>
                    {patient?.firstName} {patient?.lastName}
                  </p>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-100 rounded-full'>
                  <Mail className='h-5 w-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Email</p>
                  <p className='font-medium text-gray-900'>{patient?.email}</p>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-100 rounded-full'>
                  <Phone className='h-5 w-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Phone</p>
                  <p className='font-medium text-gray-900'>{patient?.phone}</p>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-100 rounded-full'>
                  <Shield className='h-5 w-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-500'>NIC</p>
                  <p className='font-medium text-gray-900'>{patient?.nic}</p>
                </div>
              </div>

              {age && (
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-green-100 rounded-full'>
                    <Calendar className='h-5 w-5 text-green-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Age</p>
                    <p className='font-medium text-gray-900'>
                      {age} years {ageGroup ? `(${ageGroup})` : ''}
                    </p>
                  </div>
                </div>
              )}

              {patient?.bloodType && (
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-red-100 rounded-full'>
                    <Droplet className='h-5 w-5 text-red-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Blood Type</p>
                    <p className='font-medium text-gray-900'>
                      {patient.bloodType}
                    </p>
                  </div>
                </div>
              )}

              {patient?.bmi && (
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-purple-100 rounded-full'>
                    <TrendingUp className='h-5 w-5 text-purple-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>BMI</p>
                    <p
                      className={`font-medium ${getBMICategoryColor(patient.bmiCategory)}`}
                    >
                      {patient.bmi} ({patient.bmiCategory})
                    </p>
                  </div>
                </div>
              )}

              {patient?.address?.city && (
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-indigo-100 rounded-full'>
                    <MapPin className='h-5 w-5 text-indigo-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Location</p>
                    <p className='font-medium text-gray-900'>
                      {patient.address.city},{' '}
                      {patient.address.country || 'Sri Lanka'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'
        >
          <div className='bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-500'>
                  Total Appointments
                </p>
                <p className='text-3xl font-bold text-gray-900 mt-2'>
                  {stats.totalAppointments}
                </p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <Calendar className='h-8 w-8 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-500'>Upcoming</p>
                <p className='text-3xl font-bold text-green-600 mt-2'>
                  {stats.upcomingAppointments}
                </p>
              </div>
              <div className='p-3 bg-green-100 rounded-full'>
                <Clock className='h-8 w-8 text-green-600' />
              </div>
            </div>
            {stats.nextAppointment && (
              <p className='text-xs text-gray-500 mt-2'>
                Next: {formatDate(new Date(stats.nextAppointment))}
              </p>
            )}
          </div>

          <div className='bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-500'>
                  Medical Records
                </p>
                <p className='text-3xl font-bold text-purple-600 mt-2'>
                  {stats.medicalRecordsCount}
                </p>
              </div>
              <div className='p-3 bg-purple-100 rounded-full'>
                <FileText className='h-8 w-8 text-purple-600' />
              </div>
            </div>
            <p className='text-xs text-gray-500 mt-2'>
              {stats.prescriptionsCount} prescriptions
            </p>
          </div>

          <div className='bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-500'>Orders</p>
                <p className='text-3xl font-bold text-orange-600 mt-2'>
                  {stats.ordersCount}
                </p>
              </div>
              <div className='p-3 bg-orange-100 rounded-full'>
                <Package className='h-8 w-8 text-orange-600' />
              </div>
            </div>
            <p className='text-xs text-gray-500 mt-2'>
              {stats.activePrescriptions} active prescriptions
            </p>
          </div>
        </motion.div>

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-white rounded-xl shadow-lg overflow-hidden'
        >
          <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Recent Activity
            </h2>
          </div>

          {/* Filters */}
          <div className='p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 bg-gray-50'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
              <input
                type='text'
                placeholder='Search activities...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
            >
              <option value='all'>All Activities</option>
              <option value='appointment'>Appointments</option>
              <option value='medical_record'>Medical Records</option>
              <option value='prescription'>Prescriptions</option>
              <option value='order'>Orders</option>
            </select>
          </div>

          {/* Activities List */}
          <div className='divide-y divide-gray-200'>
            {getCombinedActivities().length === 0 ? (
              <div className='p-8 text-center text-gray-500'>
                <Activity className='h-12 w-12 mx-auto mb-3 text-gray-400' />
                <p>No recent activities found</p>
              </div>
            ) : (
              getCombinedActivities().map((activity, index) => (
                <motion.div
                  key={`${activity.type}-${activity.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className='p-6 hover:bg-gray-50 transition-colors'
                >
                  <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        {getActivityIcon(activity.type)}
                        <h3 className='font-semibold text-gray-900'>
                          {activity.title}
                        </h3>
                        {activity.status && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}
                          >
                            {activity.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      {activity.description && (
                        <p className='text-gray-600 text-sm mt-1'>
                          {activity.description}
                        </p>
                      )}
                      <p className='text-gray-400 text-xs mt-2'>
                        {formatDate(new Date(activity.date))}
                      </p>
                    </div>

                    <div className='flex gap-2'>
                      {activity.type === 'appointment' && (
                        <Link
                          href={`/patient/appointments/${activity.id}`}
                          className='inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'
                        >
                          <Eye className='h-4 w-4' />
                          View Details
                        </Link>
                      )}
                      {activity.type === 'prescription' && (
                        <Link
                          href={`/doctor/prescriptions/patient/${activity.id}`}
                          className='inline-flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium'
                        >
                          <Eye className='h-4 w-4' />
                          View Details
                        </Link>
                      )}
                      {activity.type === 'order' && (
                        <Link
                          href={`/my-orders/${activity.id}`}
                          className='inline-flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium'
                        >
                          <Eye className='h-4 w-4' />
                          Track Order
                        </Link>
                      )}
                      {activity.type === 'medical_record' && (
                        <Link
                          href={`/records/patient/${activity.id}`}
                          className='inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium'
                        >
                          <Eye className='h-4 w-4' />
                          View Record
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* View All Links */}
          <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4'>
            <Link
              href='/patient/appointments'
              className='text-center text-blue-600 hover:text-blue-800 font-medium inline-flex items-center justify-center gap-1 text-sm'
            >
              View All Appointments →
            </Link>
            <Link
              href='/records/patient'
              className='text-center text-green-600 hover:text-green-800 font-medium inline-flex items-center justify-center gap-1 text-sm'
            >
              View Medical Records →
            </Link>
            <Link
              href='/doctor/prescriptions/patient'
              className='text-center text-red-600 hover:text-red-800 font-medium inline-flex items-center justify-center gap-1 text-sm'
            >
              View Prescriptions →
            </Link>
            <Link
              href='/my-orders'
              className='text-center text-purple-600 hover:text-purple-800 font-medium inline-flex items-center justify-center gap-1 text-sm'
            >
              View Orders →
            </Link>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='mt-8 grid grid-cols-1 md:grid-cols-4 gap-4'
        >
          <Link
            href='/patient/appointments/book'
            className='bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105'
          >
            <Calendar className='h-8 w-8 mb-3' />
            <h3 className='text-lg font-semibold mb-1'>Book Appointment</h3>
            <p className='text-blue-100 text-sm'>
              Schedule a new appointment with your doctor
            </p>
          </Link>

          <Link
            href='/my-orders'
            className='bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105'
          >
            <Package className='h-8 w-8 mb-3' />
            <h3 className='text-lg font-semibold mb-1'>Order Medicines</h3>
            <p className='text-purple-100 text-sm'>
              Purchase medicines from our pharmacy
            </p>
          </Link>

          <Link
            href='/doctor/prescriptions/patient'
            className='bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105'
          >
            <Heart className='h-8 w-8 mb-3' />
            <h3 className='text-lg font-semibold mb-1'>My Prescriptions</h3>
            <p className='text-red-100 text-sm'>
              View and manage your prescriptions
            </p>
          </Link>

          <Link
            href='/profile'
            className='bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105'
          >
            <User className='h-8 w-8 mb-3' />
            <h3 className='text-lg font-semibold mb-1'>Update Profile</h3>
            <p className='text-green-100 text-sm'>
              Keep your personal information up to date
            </p>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
