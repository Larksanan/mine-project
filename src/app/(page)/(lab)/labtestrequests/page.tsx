/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar as Calendar,
  FiClock as Clock,
  FiUser as User,
  FiSearch as Search,
  FiCheckCircle as CheckCircle,
  FiArrowLeft as ArrowLeft,
  FiArrowRight as ArrowRight,
  FiAlertCircle as AlertCircle,
  FiFileText as FileText,
  FiActivity as Activity,
  FiStar as Star,
  FiMapPin as MapPin,
  FiRefreshCw as RefreshCw,
  FiDollarSign as DollarSign,
} from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Toast from '@/components/ui/Toast';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialization?: string;
  department?: string;
  image?: string | null;
  experience?: number;
  consultationFee?: number;
  rating?: { average: number; count: number };
  availability?: { days: string[]; startTime: string; endTime: string };
}

interface LabTest {
  _id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  duration?: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  period: 'AM' | 'PM';
}

interface BookingForm {
  doctorId: string;
  test: string;
  date: string;
  timeSlot: string;
  appointmentType: string;
  reason: string;
  notes: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}

const TIME_SLOTS: TimeSlot[] = [
  { time: '08:00', available: true, period: 'AM' },
  { time: '08:30', available: false, period: 'AM' },
  { time: '09:00', available: true, period: 'AM' },
  { time: '09:30', available: true, period: 'AM' },
  { time: '10:00', available: false, period: 'AM' },
  { time: '10:30', available: true, period: 'AM' },
  { time: '11:00', available: true, period: 'AM' },
  { time: '11:30', available: false, period: 'AM' },
  { time: '12:00', available: true, period: 'PM' },
  { time: '13:00', available: true, period: 'PM' },
  { time: '13:30', available: false, period: 'PM' },
  { time: '14:00', available: true, period: 'PM' },
  { time: '14:30', available: true, period: 'PM' },
  { time: '15:00', available: false, period: 'PM' },
  { time: '15:30', available: true, period: 'PM' },
  { time: '16:00', available: true, period: 'PM' },
  { time: '16:30', available: false, period: 'PM' },
  { time: '17:00', available: true, period: 'PM' },
];

const APPOINTMENT_TYPES = [
  {
    value: 'CONSULTATION',
    label: 'Consultation',
    icon: '🩺',
    desc: 'General medical consultation',
  },
  {
    value: 'FOLLOW_UP',
    label: 'Follow-up',
    icon: '🔄',
    desc: 'Follow-up on previous visit',
  },
  {
    value: 'EMERGENCY',
    label: 'Emergency',
    icon: '🚨',
    desc: 'Urgent medical attention',
  },
  {
    value: 'CHECKUP',
    label: 'Check-up',
    icon: '✅',
    desc: 'Routine health check-up',
  },
  {
    value: 'LAB_TEST',
    label: 'Lab Test',
    icon: '🧪',
    desc: 'Laboratory test referral',
  },
  {
    value: 'PROCEDURE',
    label: 'Procedure',
    icon: '⚕️',
    desc: 'Medical procedure or treatment',
  },
];

const STEPS = ['Doctor', 'Lab Test', 'Date & Time', 'Details', 'Confirm'];

const formatTime = (time: string): string => {
  const [hour, min] = time.split(':');
  const h = parseInt(hour);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${min} ${suffix}`;
};

export default function PatientBookingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<LabTest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [form, setForm] = useState<BookingForm>({
    doctorId: '',
    test: '',
    date: '',
    timeSlot: '',
    appointmentType: '',
    reason: '',
    notes: '',
    priority: 'NORMAL',
  });
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setFilteredDoctors(
      doctorSearch
        ? doctors.filter(
            d =>
              d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
              d.specialization
                ?.toLowerCase()
                .includes(doctorSearch.toLowerCase()) ||
              d.department?.toLowerCase().includes(doctorSearch.toLowerCase())
          )
        : doctors
    );
  }, [doctorSearch, doctors]);

  useEffect(() => {
    let filtered = labTests;
    if (selectedCategory !== 'All')
      filtered = filtered.filter(t => t.category === selectedCategory);
    if (testSearch)
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
          t.category.toLowerCase().includes(testSearch.toLowerCase())
      );
    setFilteredTests(filtered);
  }, [testSearch, selectedCategory, labTests]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [doctorsRes, testsRes] = await Promise.all([
        fetch('/api/admin/doctor'),
        fetch('/api/lab/lab-tests'),
      ]);
      const doctorsData = await doctorsRes.json();
      const testsData = await testsRes.json();

      const normalized: Doctor[] = (doctorsData.data || []).map((d: any) => ({
        ...d,
        _id: d.id,
      }));
      setDoctors(normalized);
      setFilteredDoctors(normalized);

      const tests: LabTest[] = testsData.tests || [];
      setLabTests(tests);
      setFilteredTests(tests);

      // Build unique category list from tests
      const cats = [
        'All',
        ...Array.from(
          new Set(tests.map((t: LabTest) => t.category).filter(Boolean))
        ),
      ];
      setCategories(cats);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Failed to load data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 0 && !form.doctorId) {
      setToast({
        show: true,
        message: 'Please select a doctor',
        type: 'error',
      });
      return;
    }
    if (currentStep === 1 && !form.test) {
      setToast({
        show: true,
        message: 'Please select a lab test',
        type: 'error',
      });
      return;
    }
    if (currentStep === 2 && (!form.date || !form.timeSlot)) {
      setToast({
        show: true,
        message: 'Please select a date and time slot',
        type: 'error',
      });
      return;
    }
    if (currentStep === 3 && (!form.appointmentType || !form.reason)) {
      setToast({
        show: true,
        message: 'Please fill in the required fields',
        type: 'error',
      });
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/lab/lab-test-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: form.doctorId,
          test: form.test,
          appointmentType: form.appointmentType,
          reason: form.reason,
          notes: form.notes || undefined,
          priority: form.priority,
          date: form.date,
          timeSlot: form.timeSlot,
          scheduledDate: new Date(`${form.date}T${form.timeSlot}`),
          requestedDate: new Date(),
          status: 'REQUESTED',
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error ||
            (result.details as string[])?.join(', ') ||
            'Booking failed'
        );
      setToast({
        show: true,
        message: 'Appointment booked successfully!',
        type: 'success',
      });
      setTimeout(
        () => router.push('/labtestrequests/patient/appointments'),
        2000
      );
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || 'Booking failed',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center'>
        <Loading />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8'>
      {/* Decorative blobs */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000'></div>
      </div>

      <div className='max-w-4xl mx-auto relative z-10'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3'>
            <Calendar className='w-10 h-10 text-blue-600' />
            Book an Appointment
          </h1>
          <p className='text-gray-600 mt-2'>
            Schedule your visit with our specialists
          </p>
        </div>

        {/* Stepper */}
        <div className='bg-white rounded-3xl shadow-xl p-6 mb-6'>
          <div className='flex items-center justify-between relative'>
            <div className='absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0'>
              <div
                className='h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-500'
                style={{
                  width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
                }}
              />
            </div>
            {STEPS.map((step, index) => (
              <div
                key={step}
                className='flex flex-col items-center relative z-10'
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    index < currentStep
                      ? 'bg-linear-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : index === currentStep
                        ? 'bg-linear-to-r from-blue-500 to-purple-500 text-white shadow-lg ring-4 ring-blue-100'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className='w-5 h-5' />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold hidden sm:block ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode='wait'>
          {/* ── STEP 0: Doctor ── */}
          {currentStep === 0 && (
            <motion.div
              key='step0'
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className='bg-white rounded-3xl shadow-xl p-6'
            >
              <h2 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                <User className='w-6 h-6 text-blue-600' /> Select a Doctor
              </h2>
              <div className='relative mb-6'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search by name, specialty or department...'
                  value={doctorSearch}
                  onChange={e => setDoctorSearch(e.target.value)}
                  className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                />
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1'>
                {filteredDoctors.length === 0 ? (
                  <div className='col-span-2 text-center py-12'>
                    <User className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                    <p className='text-gray-500'>No doctors found</p>
                  </div>
                ) : (
                  filteredDoctors.map(doctor => (
                    <motion.div
                      key={doctor._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setForm(prev => ({ ...prev, doctorId: doctor._id }));
                      }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.doctorId === doctor._id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                    >
                      <div className='flex items-start gap-3'>
                        {doctor.image ? (
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className='w-12 h-12 rounded-full object-cover shrink-0'
                          />
                        ) : (
                          <div className='w-12 h-12 bg-linear-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0'>
                            {doctor.name.charAt(0)}
                          </div>
                        )}
                        <div className='flex-1 min-w-0'>
                          <p className='font-bold text-gray-800 truncate'>
                            {doctor.name}
                          </p>
                          {doctor.specialization && (
                            <p className='text-sm text-blue-600 font-medium flex items-center gap-1 mt-0.5'>
                              <Activity className='w-3 h-3' />
                              {doctor.specialization}
                            </p>
                          )}
                          {doctor.department && (
                            <p className='text-xs text-gray-500 flex items-center gap-1 mt-0.5'>
                              <MapPin className='w-3 h-3' />
                              {doctor.department}
                            </p>
                          )}
                          <div className='flex items-center justify-between mt-2'>
                            <div className='flex items-center gap-1'>
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${doctor.rating && s <= Math.round(doctor.rating.average) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                                />
                              ))}
                              <span className='text-xs text-gray-500 ml-1'>
                                {doctor.rating?.average?.toFixed(1) ?? '—'}
                              </span>
                            </div>
                            {doctor.consultationFee !== undefined && (
                              <span className='text-xs font-semibold text-emerald-600 flex items-center gap-0.5'>
                                <DollarSign className='w-3 h-3' />
                                {doctor.consultationFee}
                              </span>
                            )}
                          </div>
                          {doctor.availability?.days?.length ? (
                            <p className='text-xs text-gray-400 mt-1'>
                              {doctor.availability.days.join(', ')} ·{' '}
                              {doctor.availability.startTime}–
                              {doctor.availability.endTime}
                            </p>
                          ) : null}
                        </div>
                        {form.doctorId === doctor._id && (
                          <CheckCircle className='w-5 h-5 text-blue-600 shrink-0' />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Lab Test ── */}
          {currentStep === 1 && (
            <motion.div
              key='step1'
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className='bg-white rounded-3xl shadow-xl p-6'
            >
              <h2 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                <span className='text-2xl'>🧪</span> Select Lab Test
              </h2>
              <div className='relative mb-4'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search tests...'
                  value={testSearch}
                  onChange={e => setTestSearch(e.target.value)}
                  className='w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                />
              </div>
              {/* Category pills */}
              <div className='flex gap-2 flex-wrap mb-5'>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedCategory === cat ? 'bg-linear-to-r from-blue-500 to-purple-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Test cards */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1'>
                {filteredTests.length === 0 ? (
                  <div className='col-span-2 text-center py-12'>
                    <p className='text-4xl mb-3'>🧪</p>
                    <p className='text-gray-500'>No tests found</p>
                  </div>
                ) : (
                  filteredTests.map(test => (
                    <motion.div
                      key={test._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedTest(test);
                        setForm(prev => ({ ...prev, test: test._id }));
                      }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.test === test._id ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'}`}
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1 min-w-0'>
                          <p className='font-bold text-gray-800 truncate'>
                            {test.name}
                          </p>
                          <span className='inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full'>
                            {test.category}
                          </span>
                          {test.description && (
                            <p className='text-xs text-gray-500 mt-1 line-clamp-2'>
                              {test.description}
                            </p>
                          )}
                          {test.duration && (
                            <p className='text-xs text-gray-400 mt-1 flex items-center gap-1'>
                              <Clock className='w-3 h-3' />
                              {test.duration} min
                            </p>
                          )}
                        </div>
                        <div className='text-right shrink-0'>
                          <p className='font-bold text-emerald-600 text-lg'>
                            ${test.price}
                          </p>
                          {form.test === test._id && (
                            <CheckCircle className='w-5 h-5 text-purple-600 mt-1 ml-auto' />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Date & Time ── */}
          {currentStep === 2 && (
            <motion.div
              key='step2'
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className='bg-white rounded-3xl shadow-xl p-6'
            >
              <h2 className='text-xl font-bold text-gray-800 mb-6 flex items-center gap-2'>
                <Calendar className='w-6 h-6 text-blue-600' /> Select Date &
                Time
              </h2>
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Appointment Date
                </label>
                <input
                  type='date'
                  min={today}
                  value={form.date}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      date: e.target.value,
                      timeSlot: '',
                    }))
                  }
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-800'
                />
              </div>
              {form.date && (
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-3'>
                    <Clock className='inline w-4 h-4 mr-1 text-blue-600' />
                    Available Time Slots
                  </label>
                  <div className='mb-4'>
                    <p className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-2'>
                      Morning
                    </p>
                    <div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
                      {TIME_SLOTS.filter(s => s.period === 'AM').map(slot => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() =>
                            setForm(prev => ({ ...prev, timeSlot: slot.time }))
                          }
                          className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                            !slot.available
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                              : form.timeSlot === slot.time
                                ? 'bg-linear-to-r from-blue-500 to-purple-500 text-white shadow-md'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          {formatTime(slot.time)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-2'>
                      Afternoon
                    </p>
                    <div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
                      {TIME_SLOTS.filter(s => s.period === 'PM').map(slot => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() =>
                            setForm(prev => ({ ...prev, timeSlot: slot.time }))
                          }
                          className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                            !slot.available
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                              : form.timeSlot === slot.time
                                ? 'bg-linear-to-r from-blue-500 to-purple-500 text-white shadow-md'
                                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                          }`}
                        >
                          {formatTime(slot.time)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className='flex items-center gap-4 mt-4 text-xs text-gray-500'>
                    <span className='flex items-center gap-1'>
                      <span className='w-3 h-3 rounded-full bg-blue-100 border border-blue-200 inline-block'></span>
                      Available
                    </span>
                    <span className='flex items-center gap-1'>
                      <span className='w-3 h-3 rounded-full bg-gray-100 inline-block'></span>
                      Booked
                    </span>
                    <span className='flex items-center gap-1'>
                      <span className='w-3 h-3 rounded-full bg-blue-500 inline-block'></span>
                      Selected
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 3: Details ── */}
          {currentStep === 3 && (
            <motion.div
              key='step3'
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className='bg-white rounded-3xl shadow-xl p-6'
            >
              <h2 className='text-xl font-bold text-gray-800 mb-6 flex items-center gap-2'>
                <FileText className='w-6 h-6 text-blue-600' /> Appointment
                Details
              </h2>
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>
                  Appointment Type <span className='text-red-500'>*</span>
                </label>
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                  {APPOINTMENT_TYPES.map(type => (
                    <motion.button
                      key={type.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setForm(prev => ({
                          ...prev,
                          appointmentType: type.value,
                        }))
                      }
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${form.appointmentType === type.value ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                      <span className='text-2xl'>{type.icon}</span>
                      <p className='font-bold text-gray-800 text-sm mt-1'>
                        {type.label}
                      </p>
                      <p className='text-xs text-gray-500 mt-0.5'>
                        {type.desc}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Priority <span className='text-red-500'>*</span>
                </label>
                <div className='flex gap-3'>
                  {(['NORMAL', 'HIGH', 'URGENT'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() =>
                        setForm(prev => ({ ...prev, priority: p }))
                      }
                      className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                        form.priority === p
                          ? p === 'NORMAL'
                            ? 'bg-slate-600 text-white border-slate-600'
                            : p === 'HIGH'
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-red-500 text-white border-red-500'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Reason for Visit <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  placeholder='Brief description of your concern...'
                  value={form.reason}
                  onChange={e =>
                    setForm(prev => ({ ...prev, reason: e.target.value }))
                  }
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Additional Notes{' '}
                  <span className='text-gray-400 font-normal'>(optional)</span>
                </label>
                <textarea
                  placeholder='Any additional information or special requirements...'
                  value={form.notes}
                  onChange={e =>
                    setForm(prev => ({ ...prev, notes: e.target.value }))
                  }
                  rows={4}
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none'
                />
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Confirm ── */}
          {currentStep === 4 && (
            <motion.div
              key='step4'
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className='bg-white rounded-3xl shadow-xl p-6'
            >
              <h2 className='text-xl font-bold text-gray-800 mb-6 flex items-center gap-2'>
                <CheckCircle className='w-6 h-6 text-emerald-600' /> Confirm
                Booking
              </h2>
              <div className='bg-linear-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-4 border border-blue-100'>
                {/* Doctor */}
                <div className='flex items-center gap-4 pb-4 border-b border-blue-100 mb-4'>
                  {selectedDoctor?.image ? (
                    <img
                      src={selectedDoctor.image}
                      alt={selectedDoctor.name}
                      className='w-14 h-14 rounded-full object-cover'
                    />
                  ) : (
                    <div className='w-14 h-14 bg-linear-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xl'>
                      {selectedDoctor?.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className='text-xs text-gray-500 uppercase tracking-wider'>
                      Doctor
                    </p>
                    <p className='font-bold text-gray-800 text-lg'>
                      {selectedDoctor?.name}
                    </p>
                    {selectedDoctor?.specialization && (
                      <p className='text-sm text-blue-600'>
                        {selectedDoctor.specialization}
                      </p>
                    )}
                  </div>
                </div>
                {/* Lab Test */}
                {selectedTest && (
                  <div className='pb-4 border-b border-blue-100 mb-4'>
                    <p className='text-xs text-gray-500 uppercase tracking-wider mb-1'>
                      Lab Test
                    </p>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-bold text-gray-800'>
                          {selectedTest.name}
                        </p>
                        <span className='inline-block mt-0.5 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full'>
                          {selectedTest.category}
                        </span>
                      </div>
                      <p className='font-bold text-emerald-600 text-xl'>
                        ${selectedTest.price}
                      </p>
                    </div>
                  </div>
                )}
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-xs text-gray-500 uppercase tracking-wider mb-1'>
                      Date
                    </p>
                    <p className='font-semibold text-gray-800 flex items-center gap-1'>
                      <Calendar className='w-4 h-4 text-blue-500' />
                      {form.date
                        ? new Date(form.date + 'T00:00:00').toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 uppercase tracking-wider mb-1'>
                      Time
                    </p>
                    <p className='font-semibold text-gray-800 flex items-center gap-1'>
                      <Clock className='w-4 h-4 text-blue-500' />
                      {form.timeSlot ? formatTime(form.timeSlot) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 uppercase tracking-wider mb-1'>
                      Type
                    </p>
                    <p className='font-semibold text-gray-800'>
                      {APPOINTMENT_TYPES.find(
                        t => t.value === form.appointmentType
                      )?.label || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 uppercase tracking-wider mb-1'>
                      Priority
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        form.priority === 'NORMAL'
                          ? 'bg-slate-100 text-slate-700'
                          : form.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {form.priority}
                    </span>
                  </div>
                  <div className='col-span-2'>
                    <p className='text-xs text-gray-500 uppercase tracking-wider mb-1'>
                      Reason
                    </p>
                    <p className='font-semibold text-gray-800'>
                      {form.reason || 'N/A'}
                    </p>
                  </div>
                  {form.notes && (
                    <div className='col-span-2'>
                      <p className='text-xs text-gray-500 uppercase tracking-wider mb-1'>
                        Notes
                      </p>
                      <p className='text-gray-700 text-sm'>{form.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              {selectedTest && (
                <div className='flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4'>
                  <div>
                    <p className='font-semibold text-gray-700'>
                      Estimated Total
                    </p>
                    <p className='text-xs text-gray-500 mt-0.5'>
                      {selectedDoctor?.consultationFee !== undefined
                        ? `Consultation $${selectedDoctor.consultationFee} + `
                        : ''}
                      Test ${selectedTest.price}
                    </p>
                  </div>
                  <p className='text-2xl font-bold text-emerald-600'>
                    $
                    {(
                      (selectedDoctor?.consultationFee ?? 0) +
                      selectedTest.price
                    ).toFixed(2)}
                  </p>
                </div>
              )}

              <div className='flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4'>
                <AlertCircle className='w-5 h-5 text-amber-600 shrink-0 mt-0.5' />
                <p className='text-sm text-amber-700'>
                  Please arrive 10 minutes before your scheduled time. Bring any
                  relevant medical records or previous test results.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav buttons */}
        <div className='flex items-center justify-between mt-6'>
          <button
            onClick={currentStep === 0 ? () => router.back() : handleBack}
            className='px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-lg'
          >
            <ArrowLeft className='w-5 h-5' />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className='px-8 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2'
            >
              Next <ArrowRight className='w-5 h-5' />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className='px-8 py-3 bg-linear-to-r from-emerald-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70'
            >
              {submitting ? (
                <>
                  <RefreshCw className='w-5 h-5 animate-spin' />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle className='w-5 h-5' />
                  Confirm Booking
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
