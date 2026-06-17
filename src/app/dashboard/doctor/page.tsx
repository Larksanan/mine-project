/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Loading from '../../../components/Loading';
import Error from '../../../components/Error';
import {
  FiUsers,
  FiCalendar,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiFileText,
  FiDollarSign,
  FiChevronRight,
  FiUserCheck,
} from 'react-icons/fi';
import { MdOutlineMedicalServices } from 'react-icons/md';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DoctorStats {
  totalPatients: number;
  totalAppointments: number;
  upcomingAppointments: number;
  recentRecords: number;
  averageRating: number;
  totalRatings: number;
  todayAppointments: number;
  patientAgeGroups: {
    under18: number;
    age18to35: number;
    age36to60: number;
    over60: number;
  };
  commonDiagnoses: Array<{
    diagnosis: string;
    count: number;
  }>;
  monthlyStats: Array<{
    month: number;
    year: number;
    appointments: number;
    patients: number;
  }>;
}

interface DoctorProfile {
  name: string;
  email: string;
  specialization: string;
  hospital: string;
  experience: number;
  consultationFee: number;
  bio: string;
  profilePicture?: string;
  licenseNumber: string;
  education: string[];
  awards: string[];
  availableHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
}

interface Appointment {
  _id: string;
  patient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  type: string;
  reason: string;
}

interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  today: number;
}

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentStats, setAppointmentStats] =
    useState<AppointmentStats | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/dashboard/doctor');
      return;
    }

    if (session.user?.role !== 'DOCTOR') {
      router.push('/dashboard');
      return;
    }

    fetchDashboardData();
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchJson = async (res: Response) => {
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return null;
        return res.json();
      };

      const [statsRes, profileRes, appointmentsRes, appointmentStatsRes] =
        await Promise.all([
          fetch('/api/doctor/profile/stats'),
          fetch('/api/doctor/profile'),
          fetch('/api/appointments/Doctor/appointments'),
          fetch('/api/appointments/Doctor/stats'),
        ]);

      const statsData = await fetchJson(statsRes);
      if (statsData?.success) setStats(statsData.data);

      const profileData = await fetchJson(profileRes);
      if (profileData?.success) setProfile(profileData.data);

      const appointmentsData = await fetchJson(appointmentsRes);
      if (appointmentsData?.success) {
        setAppointments(
          (appointmentsData.data?.appointments || []).filter((app: any) => app.patient)
        );
      }

      const appointmentStatsData = await fetchJson(appointmentStatsRes);
      if (appointmentStatsData?.success) {
        setAppointmentStats(appointmentStatsData.data);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data from appointments or use fallback
  const generateChartData = () => {
    if (appointments.length === 0) {
      // Generate last 6 months with zero data
      const data = [];
      const currentDate = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        data.push({
          name: date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          appointments: 0,
          patients: 0,
        });
      }

      return data;
    }

    // Group appointments by month
    const monthlyData: {
      [key: string]: { appointments: number; patients: Set<string> };
    } = {};

    appointments.forEach(appointment => {
      if (!appointment.patient) return;

      const date = new Date(appointment.appointmentDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          appointments: 0,
          patients: new Set(),
        };
      }

      monthlyData[monthKey].appointments += 1;
      monthlyData[monthKey].patients.add(appointment.patient.email);
    });

    // Convert to array and sort by date
    const chartData = Object.entries(monthlyData)
      .map(([key, value]) => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month, 1);
        return {
          date,
          name: date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          appointments: value.appointments,
          patients: value.patients.size,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Get last 6 months of data or all if less than 6
    return chartData.slice(-6);
  };

  const statsCards = [
    {
      title: 'Total Appointments',
      value: appointmentStats?.total || 0,
      icon: <FiUsers className='w-6 h-6' />,
      color: 'bg-blue-500',
      change: '+12%',
      trending: 'up',
    },
    {
      title: "Today's Appointments",
      value: appointmentStats?.today || 0,
      icon: <FiCalendar className='w-6 h-6' />,
      color: 'bg-green-500',
      change: `+${appointmentStats?.today || 0}`,
      trending: 'up',
    },
    {
      title: 'Scheduled',
      value: appointmentStats?.scheduled || 0,
      icon: <FiClock className='w-6 h-6' />,
      color: 'bg-yellow-500',
      change: `${appointmentStats?.scheduled || 0}`,
      trending: 'up',
    },
    {
      title: 'Avg. Rating',
      value: stats?.averageRating || 4.5,
      icon: <FiStar className='w-6 h-6' />,
      color: 'bg-purple-500',
      change: '+0.2',
      trending: 'up',
      isRating: true,
    },
  ];

  const chartData = generateChartData();

  const ageGroupData =
    stats?.patientAgeGroups &&
    (stats.patientAgeGroups.under18 > 0 ||
      stats.patientAgeGroups.age18to35 > 0 ||
      stats.patientAgeGroups.age36to60 > 0 ||
      stats.patientAgeGroups.over60 > 0)
      ? [
          {
            name: 'Under 18',
            value: stats.patientAgeGroups.under18,
            color: '#3B82F6',
          },
          {
            name: '18-35',
            value: stats.patientAgeGroups.age18to35,
            color: '#10B981',
          },
          {
            name: '36-60',
            value: stats.patientAgeGroups.age36to60,
            color: '#F59E0B',
          },
          {
            name: 'Over 60',
            value: stats.patientAgeGroups.over60,
            color: '#8B5CF6',
          },
        ].filter(group => group.value > 0)
      : [
          { name: 'Under 18', value: 25, color: '#3B82F6' },
          { name: '18-35', value: 35, color: '#10B981' },
          { name: '36-60', value: 30, color: '#F59E0B' },
          { name: 'Over 60', value: 10, color: '#8B5CF6' },
        ];

  const diagnosisData =
    stats?.commonDiagnoses && stats.commonDiagnoses.length > 0
      ? stats.commonDiagnoses.slice(0, 5).map(d => ({
          name:
            d.diagnosis.length > 15
              ? d.diagnosis.substring(0, 15) + '...'
              : d.diagnosis,
          value: d.count,
        }))
      : [
          { name: 'Hypertension', value: 15 },
          { name: 'Diabetes', value: 12 },
          { name: 'Asthma', value: 10 },
          { name: 'Arthritis', value: 8 },
          { name: 'Migraine', value: 6 },
        ];

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} />;
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 to-gray-100'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Welcome back, Dr. {profile?.name?.split(' ')[0] || 'Doctor'}
              </h1>
              <p className='text-gray-600 mt-1'>
                {profile?.specialization || 'Medical Professional'} •{' '}
                {profile?.hospital || 'Medical Center'}
              </p>
            </div>
            <div className='flex items-center gap-4'>
              <span className='text-sm text-gray-500'>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <button
                onClick={() => router.push('/profile/doctor')}
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {statsCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-gray-100'
            >
              <div className='flex items-center justify-between mb-4'>
                <div
                  className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center text-white`}
                >
                  {card.icon}
                </div>
                <div
                  className={`flex items-center gap-1 ${card.trending === 'up' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {card.trending === 'up' ? (
                    <FiTrendingUp />
                  ) : (
                    <FiTrendingDown />
                  )}
                  <span className='text-sm font-medium'>{card.change}</span>
                </div>
              </div>
              <div className='text-3xl font-bold text-gray-900 mb-1'>
                {card.isRating ? card.value.toFixed(1) : card.value}
                {card.isRating && (
                  <span className='text-sm text-gray-500'>/5</span>
                )}
              </div>
              <div className='text-gray-600'>{card.title}</div>
            </motion.div>
          ))}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column - Charts */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Appointment Trends Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl shadow-xl p-6 border border-gray-100'
            >
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h3 className='text-xl font-bold text-gray-900'>
                    Appointment Trends
                  </h3>
                  <p className='text-gray-600'>
                    {appointments.length > 0
                      ? 'Last 6 months overview'
                      : 'No appointment data yet'}
                  </p>
                </div>
                <select className='bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm'>
                  <option>Last 6 months</option>
                  <option>Last year</option>
                  <option>All time</option>
                </select>
              </div>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                    <XAxis
                      dataKey='name'
                      stroke='#6b7280'
                      fontSize={12}
                      angle={-45}
                      textAnchor='end'
                      height={80}
                    />
                    <YAxis stroke='#6b7280' fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='appointments'
                      stroke='#3B82F6'
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#3B82F6' }}
                      activeDot={{ r: 7 }}
                      name='Appointments'
                    />
                    <Line
                      type='monotone'
                      dataKey='patients'
                      stroke='#10B981'
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#10B981' }}
                      activeDot={{ r: 7 }}
                      name='Unique Patients'
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {appointments.length === 0 && (
                <div className='text-center mt-4'>
                  <p className='text-sm text-gray-500'>
                    Chart will update as you add appointments
                  </p>
                </div>
              )}
            </motion.div>

            {/* Patient Demographics */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white rounded-2xl shadow-xl p-6 border border-gray-100'
              >
                <h3 className='text-xl font-bold text-gray-900 mb-6'>
                  Patient Age Groups
                </h3>
                <div className='h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={ageGroupData}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill='#8884d8'
                        dataKey='value'
                      >
                        {ageGroupData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className='grid grid-cols-2 gap-2 mt-4'>
                  {ageGroupData.map((group, _index) => (
                    <div
                      key={group.name}
                      className='flex items-center gap-2 p-2 bg-gray-50 rounded-lg'
                    >
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: group.color }}
                      />
                      <span className='text-sm text-gray-700'>
                        {group.name}
                      </span>
                      <span className='text-sm font-semibold ml-auto'>
                        {group.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='bg-white rounded-2xl shadow-xl p-6 border border-gray-100'
              >
                <h3 className='text-xl font-bold text-gray-900 mb-6'>
                  Common Diagnoses
                </h3>
                <div className='h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={diagnosisData}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                      <XAxis
                        dataKey='name'
                        stroke='#6b7280'
                        fontSize={11}
                        angle={-45}
                        textAnchor='end'
                        height={80}
                      />
                      <YAxis stroke='#6b7280' fontSize={12} />
                      <Tooltip />
                      <Bar
                        dataKey='value'
                        fill='#8B5CF6'
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Column - Appointments & Quick Stats */}
          <div className='space-y-8'>
            {/* Upcoming Appointments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='bg-white rounded-2xl shadow-xl p-6 border border-gray-100'
            >
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-bold text-gray-900'>
                  Upcoming Appointments
                </h3>
                <button
                  onClick={() => router.push('/doctor/appointments')}
                  className='text-blue-600 hover:text-blue-700 text-sm font-medium'
                >
                  View all
                </button>
              </div>
              <div className='space-y-4 max-h-150 overflow-y-auto'>
                {appointments.length > 0 ? (
                  appointments.slice(0, 5).map((appointment, index) => (
                    <motion.div
                      key={appointment._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className='p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer'
                    >
                      <div className='flex justify-between items-start mb-2'>
                        <div>
                          <h4 className='font-semibold text-gray-900'>
                            {appointment.patient.firstName}{' '}
                            {appointment.patient.lastName}
                          </h4>
                          <p className='text-sm text-gray-600'>
                            {appointment.reason || 'General Consultation'}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            appointment.status === 'SCHEDULED'
                              ? 'bg-blue-100 text-blue-800'
                              : appointment.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-sm text-gray-500'>
                        <div className='flex items-center gap-2'>
                          <FiCalendar className='w-4 h-4' />
                          <span>
                            {new Date(
                              appointment.appointmentDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <FiClock className='w-4 h-4' />
                          <span>{appointment.appointmentTime}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className='text-center py-8'>
                    <FiCalendar className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                    <p className='text-gray-500 mb-2'>
                      No upcoming appointments
                    </p>
                    <button
                      onClick={() => router.push('/appointments/new')}
                      className='text-blue-600 hover:text-blue-700 text-sm font-medium'
                    >
                      Schedule your first appointment
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className='bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white'
            >
              <h3 className='text-xl font-bold mb-6'>Practice Summary</h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center'>
                      <MdOutlineMedicalServices className='w-5 h-5' />
                    </div>
                    <div>
                      <div className='font-medium'>Total Consultations</div>
                      <div className='text-sm opacity-90'>All time</div>
                    </div>
                  </div>
                  <div className='text-2xl font-bold'>
                    {appointmentStats?.total || 0}
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center'>
                      <FiFileText className='w-5 h-5' />
                    </div>
                    <div>
                      <div className='font-medium'>Completed</div>
                      <div className='text-sm opacity-90'>All time</div>
                    </div>
                  </div>
                  <div className='text-2xl font-bold'>
                    {appointmentStats?.completed || 0}
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center'>
                      <FiDollarSign className='w-5 h-5' />
                    </div>
                    <div>
                      <div className='font-medium'>Estimated Revenue</div>
                      <div className='text-sm opacity-90'>All time</div>
                    </div>
                  </div>
                  <div className='text-2xl font-bold'>
                    $
                    {(
                      (appointmentStats?.completed || 0) *
                      (profile?.consultationFee || 0)
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className='bg-white rounded-2xl shadow-xl p-6 border border-gray-100'
            >
              <h3 className='text-xl font-bold text-gray-900 mb-4'>
                Quick Actions
              </h3>
              <div className='space-y-3'>
                {[
                  {
                    label: 'Add New Patient',
                    icon: FiUserCheck,
                    color: 'bg-green-100 text-green-600',
                    path: '/patients/new',
                  },
                  {
                    label: 'Schedule Appointment',
                    icon: FiCalendar,
                    color: 'bg-blue-100 text-blue-600',
                    path: '/appointments/new',
                  },
                  {
                    label: 'Write Prescription',
                    icon: FiFileText,
                    color: 'bg-purple-100 text-purple-600',
                    path: '/doctor/prescriptions/new',
                  },
                  {
                    label: 'View Medical Records',
                    icon: FiActivity,
                    color: 'bg-yellow-100 text-yellow-600',
                    path: '/medical-records',
                  },
                  {
                    label: 'Manage Schedule',
                    icon: FiClock,
                    color: 'bg-pink-100 text-pink-600',
                    path: '/doctor/schedule',
                  },
                ].map((action, _index) => (
                  <motion.button
                    key={action.label}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => action.path && router.push(action.path)}
                    className='w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors'
                  >
                    <div
                      className={`${action.color} w-10 h-10 rounded-lg flex items-center justify-center`}
                    >
                      <action.icon className='w-5 h-5' />
                    </div>
                    <span className='font-medium text-gray-800 text-left flex-1'>
                      {action.label}
                    </span>
                    <FiChevronRight className='w-5 h-5 text-gray-400' />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
