'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FiUser } from 'react-icons/fi';

// Components
import { Toast } from '@/components/Toast';
import { DoctorCard } from '@/components/DoctorCard';
import { BookingModal } from '@/components/BookingModal';
import { FiltersSection } from '@/components/FiltersSection';
import Loading from '@/components/Loading';

// Hooks
import { useDoctors } from '@/hooks/useDoctors';
import { useFilters } from '@/hooks/useFilters';
import { useToast } from '@/hooks/useToast';
import { useFavorites } from '@/hooks/useFavorites';

// Types
import { DoctorProfile, BookingFormData, SortOption } from '@/types/booking';

// Animations
import { containerVariants } from '@/animations/variants';

// Helper function to filter and sort doctors (handling nested structure)
const filterAndSortDoctorsLocal = (
  doctors: DoctorProfile[],
  searchTerm: string,
  selectedSpecialization: string | null,
  selectedDepartment: string | null,
  minExperience: number,
  maxFee: number,
  sortBy: SortOption
) => {
  return (
    [...doctors]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((doctor: any) => {
        const name = doctor.user?.name || '';
        const specialization = doctor.profile?.specialization || '';
        const department = doctor.profile?.department || '';
        const experience = doctor.profile?.experience || 0;
        const fee = doctor.profile?.consultationFee || 0;

        const matchesSearch =
          !searchTerm ||
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          specialization.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSpecialization =
          !selectedSpecialization ||
          selectedSpecialization === 'All' ||
          specialization === selectedSpecialization;

        const matchesDepartment =
          !selectedDepartment ||
          selectedDepartment === 'All' ||
          department === selectedDepartment;

        const matchesExperience = experience >= minExperience;

        // If maxFee is 0, we assume it means no upper limit or filter not applied
        const matchesFee = maxFee === 0 || fee <= maxFee;

        return (
          matchesSearch &&
          matchesSpecialization &&
          matchesDepartment &&
          matchesExperience &&
          matchesFee
        );
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => {
        switch (sortBy) {
          case 'name':
            return (a.user?.name || '').localeCompare(b.user?.name || '');
          case 'experience':
            return (b.profile?.experience || 0) - (a.profile?.experience || 0);
          case 'fee':
            return (
              (a.profile?.consultationFee || 0) -
              (b.profile?.consultationFee || 0)
            );
          case 'rating':
            return (
              (b.profile?.rating?.average || 0) -
              (a.profile?.rating?.average || 0)
            );
          default:
            return 0;
        }
      })
  );
};

export default function PatientBookAppointment() {
  const router = useRouter();
  const { status } = useSession();

  // State
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(
    null
  );
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name');

  const [_saving, setSaving] = useState(false);

  // Hooks
  const { doctors, filteredDoctors, loading, setFilteredDoctors } =
    useDoctors(status);
  const { toast, showToast, hideToast } = useToast();
  const { toggleFavorite, isFavorite } = useFavorites();
  const filters = useFilters(doctors);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/patient/book-appointment');
    }
  }, [status, router]);

  // Apply filters and sorting
  useEffect(() => {
    const filtered = filterAndSortDoctorsLocal(
      doctors,
      filters.searchTerm,
      filters.selectedSpecialization,
      filters.selectedDepartment,
      filters.minExperience,
      filters.maxFee,
      sortBy
    );
    setFilteredDoctors(filtered);
  }, [
    doctors,
    filters.searchTerm,
    filters.selectedSpecialization,
    filters.selectedDepartment,
    filters.minExperience,
    filters.maxFee,
    sortBy,
    setFilteredDoctors,
  ]);

  const handleSelectDoctor = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedDoctor(null);
  };

  const handleBookingSubmit = async (formData: BookingFormData) => {
    setSaving(true);

    try {
      const response = await fetch('/api/appointments/patient/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          appointmentDate: new Date(formData.appointmentDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to book appointment');
      }

      const result = await response.json();

      if (result.success) {
        showToast('Appointment booked successfully!', 'success');
        setTimeout(() => {
          router.push('/patient/appointments');
        }, 2000);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to book appointment',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = (doctorId: string) => {
    toggleFavorite(doctorId);
    showToast(
      isFavorite(doctorId) ? 'Removed from favorites' : 'Added to favorites',
      isFavorite(doctorId) ? 'info' : 'success'
    );
  };

  if (status === 'loading' || loading) {
    return <Loading />;
  }

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className='min-h-screen bg-linear-to-br from-blue-50 via-gray-50 to-blue-50 py-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='mb-8 text-center'
          ></motion.div>

          {/* Search and Filters */}
          <FiltersSection
            showFilters={filters.showFilters}
            onToggleFilters={() => filters.setShowFilters(!filters.showFilters)}
            filters={{
              searchTerm: filters.searchTerm,
              selectedSpecialization: filters.selectedSpecialization,
              selectedDepartment: filters.selectedDepartment,
              minExperience: filters.minExperience,
              maxFee: filters.maxFee,
            }}
            onFilterChange={(filter, value) => {
              switch (filter) {
                case 'searchTerm':
                  filters.setSearchTerm(value);
                  break;
                case 'selectedSpecialization':
                  filters.setSelectedSpecialization(value);
                  break;
                case 'selectedDepartment':
                  filters.setSelectedDepartment(value);
                  break;
                case 'minExperience':
                  filters.setMinExperience(value);
                  break;
                case 'maxFee':
                  filters.setMaxFee(value);
                  break;
              }
            }}
            specializations={filters.specializations}
            departments={filters.departments}
            onClearFilters={filters.clearFilters}
          />

          {/* Sort Options */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='flex items-center gap-4 mb-6'
          >
            <span className='text-sm font-medium text-gray-700'>Sort by:</span>
            <div className='flex gap-2'>
              {(['name', 'experience', 'fee', 'rating'] as SortOption[]).map(
                option => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      sortBy === option
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                )
              )}
            </div>
          </motion.div>

          {/* Doctors Grid */}
          <motion.div
            initial='hidden'
            animate='visible'
            variants={containerVariants}
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          >
            {filteredDoctors.map(doctor => (
              <motion.div key={doctor._id} variants={containerVariants}>
                <DoctorCard
                  doctor={doctor}
                  onSelect={handleSelectDoctor}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite(doctor._id)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* No Results */}
          {filteredDoctors.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className='text-center py-16'
            >
              <div className='inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-blue-100 to-purple-100 rounded-full mb-6'>
                <FiUser className='w-12 h-12 text-blue-600' />
              </div>
              <h3 className='text-2xl font-bold text-gray-900 mb-3'>
                No doctors found
              </h3>
              <p className='text-gray-600 mb-6 max-w-md mx-auto'>
                Try adjusting your search criteria or clear filters to see all
                available doctors.
              </p>
              <button
                onClick={filters.clearFilters}
                className='px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors'
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </div>

        {/* Booking Modal */}
        {selectedDoctor && (
          <BookingModal
            doctor={selectedDoctor}
            isOpen={showBookingModal}
            onClose={handleCloseModal}
            onSubmit={handleBookingSubmit}
          />
        )}
      </div>
    </>
  );
}
