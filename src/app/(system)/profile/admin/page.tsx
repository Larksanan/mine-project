'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile, useProfileForm } from '@/hooks/profile';
import Loading from '@/components/Loading';
import ProfileHeader from '@/components/profilel/ProfileHeader';
import ContactInfo from '@/components/profilel/ContactInfo';
import ProfessionalInfo from '@/components/profilel/ProfessionalInfo';
import BioSection from '@/components/profilel/BioSection';
import AccountStatus from '@/components/profilel/AccountStatus';
import MessageBanner from '@/components/profilel/MessageBanner';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    updateProfile,
  } = useProfile();
  const { formData, errors, updateField, validateForm, resetForm } =
    useProfileForm();
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      resetForm({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        department: profile.department || '',
        specialization: profile.specialization || '',
        address: profile.address || '',
        bio: profile.bio || '',
      });
    }
  }, [profile, resetForm]);

  const handleSaveProfile = async () => {
    setSaveError('');
    setSaveSuccess('');

    const validation = validateForm(profile?.role);

    if (!validation.success) {
      setSaveError(
        validation.errors[0]?.message || 'Please fix validation errors'
      );
      return;
    }

    try {
      await updateProfile(formData);
      setSaveSuccess('Profile updated successfully!');
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to update profile'
      );
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      resetForm({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        department: profile.department || '',
        specialization: profile.specialization || '',
        address: profile.address || '',
        bio: profile.bio || '',
      });
    }
    setIsEditing(false);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleEditToggle = () => {
    setIsEditing(true);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    updateField(field, value);
  };

  if (status === 'loading' || profileLoading) {
    return <Loading />;
  }

  if (!profile) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-2xl font-bold text-gray-900 mb-2'
          >
            Profile Not Found
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='text-gray-600'
          >
            Unable to load your profile information.
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className='min-h-screen bg-gray-50 py-8'
    >
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Messages */}
        <AnimatePresence>
          {profileError && (
            <MessageBanner type='error' message={profileError} />
          )}
          {saveError && <MessageBanner type='error' message={saveError} />}
          {saveSuccess && (
            <MessageBanner type='success' message={saveSuccess} />
          )}
        </AnimatePresence>

        {/* Profile Header */}
        <ProfileHeader
          user={profile}
          isEditing={isEditing}
          formData={formData}
          onEditToggle={handleEditToggle}
          onSave={handleSaveProfile}
          onCancel={handleCancelEdit}
          onInputChange={e => handleInputChange('name', e.target.value)}
        />

        {/* Profile Details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className='mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6'
        >
          {/* Left Column */}
          <div className='lg:col-span-2 space-y-6'>
            <ContactInfo
              user={profile}
              isEditing={isEditing}
              formData={formData}
              onInputChange={e =>
                handleInputChange(
                  e.target.name as keyof typeof formData,
                  e.target.value
                )
              }
              errors={errors}
            />

            {(profile.role === 'DOCTOR' ||
              profile.role === 'NURSE' ||
              profile.role === 'LABTECH' ||
              profile.role === 'PHARMACIST') && (
              <ProfessionalInfo
                isEditing={isEditing}
                formData={formData}
                onInputChange={e =>
                  handleInputChange(
                    e.target.name as keyof typeof formData,
                    e.target.value
                  )
                }
                errors={errors}
              />
            )}

            <BioSection
              user={profile}
              isEditing={isEditing}
              formData={formData}
              onInputChange={e => handleInputChange('bio', e.target.value)}
              errors={errors}
            />
          </div>

          {/* Right Column */}
          <div className='space-y-6'>
            <AccountStatus user={profile} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
