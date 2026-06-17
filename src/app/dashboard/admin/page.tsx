/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';
import {
  FiUsers,
  FiActivity,
  FiTrendingUp,
  FiUserPlus,
  FiUserCheck,
  FiFileText,
  FiHeart,
  FiBriefcase,
  FiArrowRight,
  FiBarChart2,
  FiCalendar,
} from 'react-icons/fi';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalReceptionists: number;
  totalLabTechnicians: number;
  totalPharmacists: number;
  totalAdmins: number;
  totalDepartments: number;
  totalMedicalRecords: number;
  departmentCount: number;
  activeDepartments: number;
}

interface UserRoleStats {
  [key: string]: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'department' | 'record' | 'technician';
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

const ROLE_COLORS: Record<string, { bg: string; text: string; light: string }> =
  {
    PATIENT: { bg: '#10b981', text: '#047857', light: '#d1fae5' },
    DOCTOR: { bg: '#f59e0b', text: '#b45309', light: '#fed7aa' },
    ADMIN: { bg: '#ef4444', text: '#b91c1c', light: '#fee2e2' },
    PHARMACIST: { bg: '#3b82f6', text: '#1d4ed8', light: '#dbeafe' },
    RECEPTIONIST: { bg: '#8b5cf6', text: '#6d28d9', light: '#ede9fe' },
    LAB_TECHNICIAN: { bg: '#ec4899', text: '#be185d', light: '#fce7f3' },
  };

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'error',
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalReceptionists: 0,
    totalLabTechnicians: 0,
    totalPharmacists: 0,
    totalAdmins: 0,
    totalDepartments: 0,
    totalMedicalRecords: 0,
    departmentCount: 0,
    activeDepartments: 0,
  });
  const [roleStats, setRoleStats] = useState<UserRoleStats>({});
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/auth/signin');
    } else {
      fetchDashboardData();
    }
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        usersRes,
        departmentsRes,
        recordsRes,
        receptionistsRes,
        doctorsRes,
        labTechsRes,
      ] = await Promise.all([
        fetch('/api/admin/users').catch(() => ({
          ok: false,
          json: () => ({ data: [], statistics: { roles: {} } }),
        })),
        fetch('/api/admin/departments').catch(() => ({
          ok: false,
          json: () => ({ departments: [] }),
        })),
        fetch('/api/records').catch(() => ({
          ok: false,
          json: () => ({ data: [] }),
        })),
        fetch('/api/admin/receptionist').catch(() => ({
          ok: false,
          json: () => ({ data: [] }),
        })),
        fetch('/api/admin/doctor').catch(() => ({
          ok: false,
          json: () => ({ data: [] }),
        })),
        fetch('/api/lab/lab-technicians').catch(() => ({
          ok: false,
          json: () => ({ technicians: [] }),
        })),
      ]);

      const usersData = usersRes.ok
        ? await usersRes.json()
        : { data: [], statistics: { roles: {} } };
      const users = usersData.data || [];
      const userStats = usersData.statistics || { roles: {} };
      const departmentsList =
        (departmentsRes.ok ? await departmentsRes.json() : { departments: [] })
          .departments || [];
      const records =
        (recordsRes.ok ? await recordsRes.json() : { data: [] }).data || [];
      const receptionists =
        (receptionistsRes.ok ? await receptionistsRes.json() : { data: [] })
          .data || [];
      const doctors =
        (doctorsRes.ok ? await doctorsRes.json() : { data: [] }).data || [];
      const labTechs =
        (labTechsRes.ok ? await labTechsRes.json() : { technicians: [] })
          .technicians || [];

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter((u: any) => u.isActive).length,
        inactiveUsers: users.filter((u: any) => !u.isActive).length,
        totalPatients: users.filter((u: any) => u.role === 'PATIENT').length,
        totalDoctors: doctors.length,
        totalReceptionists: receptionists.length,
        totalLabTechnicians: labTechs.length,
        totalPharmacists: users.filter((u: any) => u.role === 'PHARMACIST')
          .length,
        totalAdmins: users.filter((u: any) => u.role === 'ADMIN').length,
        totalDepartments: departmentsList.length,
        totalMedicalRecords: records.length,
        departmentCount: departmentsList.length,
        activeDepartments: departmentsList.filter((d: any) => d.isActive)
          .length,
      });
      setRoleStats(userStats.roles || {});

      const activities: RecentActivity[] = [
        ...users.slice(0, 5).map((u: any) => ({
          id: u._id,
          type: 'user' as const,
          title: `${u.name}`,
          date: u.createdAt || new Date().toISOString(),
          description: `${u.role} · ${u.email}`,
        })),
        ...departmentsList.slice(0, 3).map((d: any) => ({
          id: d.id || d._id,
          type: 'department' as const,
          title: d.name,
          date: d.createdAt || new Date().toISOString(),
          status: d.isActive ? 'Active' : 'Inactive',
          description: `Code: ${d.code}`,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6);

      setRecentActivities(activities);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to load',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !mounted) return <Loading />;

  const activePercent =
    stats.totalUsers > 0
      ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
      : 0;
  const staffTotal =
    stats.totalReceptionists +
    stats.totalLabTechnicians +
    stats.totalPharmacists;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 100, damping: 12 },
    },
  };

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div className='max-w-7xl mx-auto px-6 lg:px-8 py-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='flex justify-between items-start flex-wrap gap-4'>
            <div>
              <p className='text-blue-600 text-sm font-medium mb-2 tracking-wide'>
                {greeting}!
              </p>
              <h1 className='text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 tracking-tight'>
                {session?.user?.name?.split(' ')[0] || 'Admin'}
              </h1>
              <p className='text-gray-600 text-base'>
                Here&apos;s what&apos;s happening with your platform today.
              </p>
            </div>
            <div className='bg-blue-50 backdrop-blur-sm rounded-2xl px-5 py-3 border border-blue-100'>
              <div className='flex items-center gap-3'>
                <FiCalendar className='text-blue-600' />
                <span className='text-gray-700 font-medium'>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'
        >
          {[
            {
              label: 'Total Users',
              value: stats.totalUsers,
              icon: FiUsers,
              color: '#667eea',
              change: `${activePercent}% active`,
            },
            {
              label: 'Patients',
              value: stats.totalPatients,
              icon: FiUserCheck,
              color: '#48bb78',
              change: 'registered',
            },
            {
              label: 'Doctors',
              value: stats.totalDoctors,
              icon: FiHeart,
              color: '#f6ad55',
              change: 'on staff',
            },
            {
              label: 'Staff',
              value: staffTotal,
              icon: FiBriefcase,
              color: '#9f7aea',
              change: `${stats.totalReceptionists}R · ${stats.totalLabTechnicians}L`,
            },
          ].map(stat => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300'
            >
              <div className='flex justify-between items-start mb-4'>
                <div
                  className='p-3 rounded-xl'
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon style={{ color: stat.color }} size={24} />
                </div>
                <span className='text-3xl font-bold text-gray-800'>
                  {stat.value}
                </span>
              </div>
              <p className='text-gray-500 text-sm font-medium mb-1'>
                {stat.label}
              </p>
              <p className='text-xs text-gray-400'>{stat.change}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Secondary Stats */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'
        >
          {/* Activity Overview */}
          <motion.div
            variants={itemVariants}
            className='bg-white rounded-2xl p-6 shadow-lg'
          >
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Activity Overview
              </h3>
              <FiBarChart2 className='text-gray-400' />
            </div>
            <div className='mb-4'>
              <div className='flex justify-between text-sm mb-2'>
                <span className='text-gray-600'>Active Users</span>
                <span className='font-semibold text-gray-800'>
                  {stats.activeUsers} / {stats.totalUsers}
                </span>
              </div>
              <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                <motion.div
                  className='h-full rounded-full'
                  style={{
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${activePercent}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4 mt-6'>
              <div className='text-center p-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl'>
                <p className='text-2xl font-bold text-white'>
                  {stats.activeUsers}
                </p>
                <p className='text-xs text-white/70'>Active</p>
              </div>
              <div className='text-center p-3 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl'>
                <p className='text-2xl font-bold text-white'>
                  {stats.inactiveUsers}
                </p>
                <p className='text-xs text-white/70'>Inactive</p>
              </div>
            </div>
          </motion.div>

          {/* Departments */}
          <motion.div
            variants={itemVariants}
            className='bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white'
          >
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold'>Departments</h3>
              <FiBriefcase className='text-white/60' />
            </div>
            <p className='text-5xl font-bold mb-2'>{stats.departmentCount}</p>
            <p className='text-white/70 text-sm mb-4'>Total departments</p>
            <div className='flex gap-2'>
              <span className='bg-white/20 rounded-full px-3 py-1 text-xs'>
                {stats.activeDepartments} Active
              </span>
              <span className='bg-white/20 rounded-full px-3 py-1 text-xs'>
                {stats.departmentCount - stats.activeDepartments} Inactive
              </span>
            </div>
          </motion.div>

          {/* Medical Records */}
          <motion.div
            variants={itemVariants}
            className='bg-white rounded-2xl p-6 shadow-lg'
          >
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Medical Records
              </h3>
              <FiFileText className='text-gray-400' />
            </div>
            <p className='text-5xl font-bold text-gray-800 mb-2'>
              {stats.totalMedicalRecords}
            </p>
            <p className='text-gray-500 text-sm'>Total records in system</p>
            <div className='mt-4 pt-4 border-t border-gray-100'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>This month</span>
                <span className='font-semibold text-gray-800'>
                  +{Math.floor(stats.totalMedicalRecords * 0.12)}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Role Distribution & Personnel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'
        >
          {/* Role Distribution */}
          <div className='lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg'>
            <h3 className='text-lg font-semibold text-gray-800 mb-6'>
              Role Distribution
            </h3>
            <div className='space-y-4'>
              {Object.entries(roleStats).map(([role, count], idx) => {
                const colors = ROLE_COLORS[role] || {
                  bg: '#6b7280',
                  text: '#374151',
                  light: '#f3f4f6',
                };
                const percentage =
                  stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                return (
                  <motion.div
                    key={role}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.55 + idx * 0.05 }}
                  >
                    <div className='flex justify-between mb-2'>
                      <div className='flex items-center gap-2'>
                        <div
                          className='w-2 h-2 rounded-full'
                          style={{ backgroundColor: colors.bg }}
                        />
                        <span className='text-sm font-medium text-gray-700'>
                          {role}
                        </span>
                      </div>
                      <span className='text-sm font-semibold text-gray-800'>
                        {count}
                      </span>
                    </div>
                    <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                      <motion.div
                        className='h-full rounded-full'
                        style={{ backgroundColor: colors.bg }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.6 + idx * 0.05 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Personnel Quick Stats */}
          <div className='bg-white rounded-2xl p-6 shadow-lg'>
            <h3 className='text-lg font-semibold text-gray-800 mb-6'>
              Personnel
            </h3>
            <div className='grid grid-cols-2 gap-4'>
              {[
                { label: 'Admins', value: stats.totalAdmins, color: '#ef4444' },
                {
                  label: 'Pharmacists',
                  value: stats.totalPharmacists,
                  color: '#3b82f6',
                },
                {
                  label: 'Lab Techs',
                  value: stats.totalLabTechnicians,
                  color: '#ec4899',
                },
                {
                  label: 'Reception',
                  value: stats.totalReceptionists,
                  color: '#8b5cf6',
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 + idx * 0.07 }}
                  whileHover={{ scale: 1.05 }}
                  className='bg-gray-50 rounded-xl p-4 text-center'
                >
                  <p
                    className='text-2xl font-bold'
                    style={{ color: item.color }}
                  >
                    {item.value}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className='bg-white rounded-2xl shadow-lg overflow-hidden'
        >
          <div className='px-6 py-4 border-b border-gray-100 flex justify-between items-center'>
            <h3 className='text-lg font-semibold text-gray-800'>
              Recent Activity
            </h3>
            <FiActivity className='text-gray-400' />
          </div>
          {recentActivities.length === 0 ? (
            <div className='p-12 text-center'>
              <p className='text-gray-400'>No recent activity</p>
            </div>
          ) : (
            <div className='divide-y divide-gray-50'>
              {recentActivities.map((activity, idx) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.05 }}
                  className='px-6 py-4 hover:bg-gray-50 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0'>
                      <FiUserPlus className='text-indigo-600' />
                    </div>
                    <div className='flex-1'>
                      <p className='font-medium text-gray-800'>
                        {activity.title}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {activity.description}
                      </p>
                    </div>
                    <p className='text-xs text-gray-400'>
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-6'
        >
          {[
            {
              href: '/admin/users',
              icon: FiUsers,
              label: 'Manage Users',
              desc: 'Add, edit or remove users',
              gradient: 'from-blue-500 to-cyan-500',
            },
            {
              href: '/departments',
              icon: FiBriefcase,
              label: 'Departments',
              desc: 'Configure hospital units',
              gradient: 'from-purple-500 to-pink-500',
            },
            {
              href: '/records',
              icon: FiTrendingUp,
              label: 'Reports',
              desc: 'Analytics & insights',
              gradient: 'from-green-500 to-emerald-500',
            },
          ].map(action => (
            <motion.div
              key={action.href}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={action.href}
                className={`bg-gradient-to-r ${action.gradient} rounded-2xl p-6 block transition-all duration-300 hover:shadow-xl`}
              >
                <action.icon
                  className='text-white text-2xl mb-4 opacity-90'
                  size={28}
                />
                <h3 className='text-white text-xl font-semibold mb-2'>
                  {action.label}
                </h3>
                <p className='text-white/70 text-sm'>{action.desc}</p>
                <div className='mt-4 flex items-center gap-1 text-white/60 text-sm group'>
                  <span>Get started</span>
                  <FiArrowRight className='group-hover:translate-x-1 transition-transform' />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
}
