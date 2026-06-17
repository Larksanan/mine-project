/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import SuccessNotification from '@/components/products/SuccessNotification';
import ProductImageUpload from '@/components/products/ProductImageUpload';
import BasicInformationForm from '@/components/products/Form/BasicInformationForm';
import PricingStockForm from '@/components/products/Form/PricingStockForm';
import MedicalInformationForm from '@/components/products/Form/MedicalInformationForm';
import FormActions from '@/components/products/Form/FormActions';
import Loading from '@/components/ui/Loading';
import { ProductFormData } from '@/types/product';
import { productSchema } from '@/validation/product';
import { Pharmacy } from '@/types/pharmacy';
const CATEGORIES = [
  'Prescription',
  'OTC',
  'Supplements',
  'Medical Devices',
  'Personal Care',
  'First Aid',
  'Baby Care',
  'Vitamins',
  'Other',
] as const;
const DEFAULT_FORM_VALUES: Partial<ProductFormData> = {
  inStock: true,
  requiresPrescription: false,
  isControlledSubstance: false,
  minStockLevel: '10',
  name: '',
  description: '',
  price: '',
  costPrice: '',
  category: '',
  image: '',
  stockQuantity: '',
  pharmacy: '',
  sku: '',
  manufacturer: '',
  sideEffects: '',
  dosage: '',
  activeIngredients: '',
  barcode: '',
};

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [pharmaciesLoading, setPharmaciesLoading] = useState(true);
  const [pharmaciesError, setPharmaciesError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    watch,
    setValue,
    control,
    trigger,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData, any>,
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onChange',
  });

  const watchedImage = watch('image');
  const watchedRequiresPrescription = watch('requiresPrescription');
  const watchedPharmacyId = watch('pharmacy');

  // Get selected pharmacy details
  const selectedPharmacy = useMemo(() => {
    if (!watchedPharmacyId || !pharmacies.length) return null;
    return (
      pharmacies.find(pharmacy => {
        const pharmacyId =
          typeof pharmacy._id === 'object'
            ? pharmacy._id.toString()
            : pharmacy._id;
        return pharmacyId === watchedPharmacyId;
      }) || null
    );
  }, [watchedPharmacyId, pharmacies]);

  // Memoized address formatter
  const formatAddress = useCallback((address: any): string => {
    if (!address) return '';

    if (typeof address === 'string') return address;

    if (typeof address === 'object') {
      const parts = [];
      if (address.street?.trim()) parts.push(address.street.trim());
      if (address.city?.trim()) parts.push(address.city.trim());
      if (address.state?.trim()) parts.push(address.state.trim());
      if (address.zipCode?.trim()) parts.push(address.zipCode.trim());
      if (address.country?.trim()) parts.push(address.country.trim());
      return parts.join(', ');
    }

    return '';
  }, []);

  // Memoized pharmacies for performance
  const formattedPharmacies = useMemo(
    () =>
      pharmacies.map(pharmacy => ({
        ...pharmacy,
        id:
          typeof pharmacy._id === 'object'
            ? pharmacy._id.toString()
            : pharmacy._id,
        formattedAddress: formatAddress(pharmacy.address),
      })),
    [pharmacies, formatAddress]
  );

  // Fetch pharmacies with better error handling
  const fetchPharmacies = useCallback(async () => {
    try {
      setPharmaciesLoading(true);
      setPharmaciesError('');

      const response = await fetch('/api/pharmacy');

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data?.success) {
        // Handle both data.pharmacies and data.data.pharmacies formats
        const pharmaciesData = data.data?.pharmacies || data.pharmacies || [];

        if (pharmaciesData.length === 0) {
          setPharmaciesError(
            'No pharmacies found. Please create a pharmacy first.'
          );
          setPharmacies([]);
          return;
        }

        // Transform API response to match Pharmacy type
        const validatedPharmacies: Pharmacy[] = pharmaciesData.map(
          (pharmacy: any) => {
            // Determine ID based on available fields
            const pharmacyId = pharmacy.id || pharmacy._id;
            const id =
              typeof pharmacyId === 'object'
                ? pharmacyId.toString()
                : pharmacyId || `pharmacy-${Date.now()}-${Math.random()}`;

            return {
              _id: id,
              id: id,
              name: pharmacy.name || 'Unknown Pharmacy',
              address: {
                street: pharmacy.address?.street || '',
                city: pharmacy.address?.city || '',
                state: pharmacy.address?.state || '',
                zipCode: pharmacy.address?.zipCode || '',
                country: pharmacy.address?.country || 'Sri Lanka',
              },
              contact: {
                phone: pharmacy.contact?.phone || '',
                email: pharmacy.contact?.email || '',
                emergencyPhone: pharmacy.contact?.emergencyPhone || '',
              },
              operatingHours: pharmacy.operatingHours || {
                Monday: '9:00 AM - 6:00 PM',
                Tuesday: '9:00 AM - 6:00 PM',
                Wednesday: '9:00 AM - 6:00 PM',
                Thursday: '9:00 AM - 6:00 PM',
                Friday: '9:00 AM - 6:00 PM',
                Saturday: '9:00 AM - 2:00 PM',
                Sunday: 'Closed',
              },
              services: pharmacy.services || [],
              pharmacists: pharmacy.pharmacists || [],
              inventory: pharmacy.inventory || {
                totalProducts: 0,
                lowStockItems: 0,
                outOfStockItems: 0,
              },
              status: pharmacy.status || 'ACTIVE',
              is24Hours: pharmacy.is24Hours || false,
              description: pharmacy.description || '',
              website: pharmacy.website || '',
              createdBy: pharmacy.createdBy || null,
              createdAt: pharmacy.createdAt
                ? new Date(pharmacy.createdAt)
                : undefined,
              updatedAt: pharmacy.updatedAt
                ? new Date(pharmacy.updatedAt)
                : undefined,
              isOpen: pharmacy.isOpen || false,
              formattedHours: pharmacy.formattedHours || 'Closed',
            };
          }
        );

        setPharmacies(validatedPharmacies);

        // Auto-select first pharmacy only if no pharmacy is already selected
        if (validatedPharmacies.length > 0 && !watchedPharmacyId) {
          const firstPharmacy = validatedPharmacies[0];
          const pharmacyId = firstPharmacy._id;

          setValue('pharmacy', pharmacyId.toString(), {
            shouldValidate: true,
          });
        }
      } else {
        throw new Error(
          data?.error || data?.message || 'Invalid response format'
        );
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      setPharmaciesError('Unable to load pharmacies. Please try again.');

      // Fallback mock data for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using development mock data');
        const mockPharmacy: Pharmacy = {
          _id: 'mock-pharmacy-1',
          userID: 'mock-pharmacy-1',
          name: 'Main Pharmacy (Development)',
          address: {
            street: 'thalaimar Main Street',
            city: 'mannar',
            state: 'Western Province',
            zipCode: '00100',
            country: 'Sri Lanka',
          },
          contact: {
            phone: '+94 11 123 4567',
            email: 'giw-hict-2021-42.ac.lk',
            emergencyPhone: '+94 77 123 4567',
          },
          operatingHours: {
            Monday: '9:00 AM - 6:00 PM',
            Tuesday: '9:00 AM - 6:00 PM',
            Wednesday: '9:00 AM - 6:00 PM',
            Thursday: '9:00 AM - 6:00 PM',
            Friday: '9:00 AM - 6:00 PM',
            Saturday: '9:00 AM - 2:00 PM',
            Sunday: 'Closed',
          },
          services: ['Prescription', 'OTC', 'Vaccinations'],
          pharmacists: [],
          inventory: {
            totalProducts: 0,
            lowStockItems: 0,
            outOfStockItems: 0,
          },
          status: 'ACTIVE',
          is24Hours: false,
          description: 'Main branch pharmacy for development',
          website: 'https://jebarsanthatcroos.com.lk',
          isOpen: true,
          formattedHours: '9:00 AM - 6:00 PM',
          createdBy: '',
        };
        setPharmacies([mockPharmacy]);
        setValue('pharmacy', mockPharmacy._id.toString(), {
          shouldValidate: true,
        });
        setPharmaciesError('');
      }
    } finally {
      setPharmaciesLoading(false);
    }
  }, [setValue, watchedPharmacyId]);

  // Generate SKU with better uniqueness
  const generateSKU = useCallback(() => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sku = `SKU-${timestamp}-${random}`;
    setValue('sku', sku, { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  // Handle image upload
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validImageTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ];
      if (!validImageTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP, GIF)');
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();

      reader.onloadstart = () => {
        setLoading(true);
      };

      reader.onload = () => {
        const base64String = reader.result as string;
        setValue('image', base64String, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setLoading(false);
      };

      reader.onerror = () => {
        alert('Error reading image file. Please try again.');
        setLoading(false);
      };

      reader.readAsDataURL(file);

      // Clean up the file input
      e.target.value = '';
    },
    [setValue]
  );

  const removeImage = useCallback(() => {
    setValue('image', '', { shouldValidate: true, shouldDirty: true });
    setImagePreview('');
  }, [setValue]);

  // Form submission
  const onSubmit = useCallback(
    async (data: ProductFormData) => {
      try {
        setLoading(true);
        setSubmitError(null);

        // Validate form before submission
        const isValid = await trigger();
        if (!isValid) {
          throw new Error('Please fix form errors before submitting');
        }

        // Check if a pharmacy is selected
        if (!data.pharmacy || data.pharmacy === 'no-pharmacy') {
          throw new Error('Please select a pharmacy');
        }

        // Prepare payload with type conversions
        const payload = {
          ...data,
          price: parseFloat(data.price),
          costPrice: data.costPrice ? parseFloat(data.costPrice) : 0,
          stockQuantity: parseInt(data.stockQuantity) || 0,
          minStockLevel: parseInt(data.minStockLevel) || 10,
          // Ensure boolean fields are properly converted
          inStock: Boolean(data.inStock),
          requiresPrescription: Boolean(data.requiresPrescription),
          isControlledSubstance: Boolean(data.isControlledSubstance),
        };

        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.error ||
              result?.message ||
              `HTTP ${response.status}: Failed to add product`
          );
        }

        // Show success and redirect
        setShowSuccess(true);
        setTimeout(() => {
          router.push('/pharmacist/shop');
          router.refresh(); // Refresh the page data
        }, 1400);
      } catch (error) {
        console.error('Error adding product:', error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : 'Failed to add product. Please try again.'
        );

        // Scroll to top to show error
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        setLoading(false);
      }
    },
    [router, trigger]
  );

  // Effects
  useEffect(() => {
    fetchPharmacies();
    generateSKU();
  }, [fetchPharmacies, generateSKU]);

  useEffect(() => {
    if (watchedImage) {
      setImagePreview(watchedImage);
    } else {
      setImagePreview('');
    }
  }, [watchedImage]);

  // Handle cancel with confirmation
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (confirmCancel) {
        router.back();
      }
    } else {
      router.back();
    }
  }, [isDirty, router]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Show loading state
  if (pharmaciesLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100'>
        <Loading />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4 md:p-6'>
      <AnimatePresence>
        {showSuccess && <SuccessNotification show={showSuccess} />}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm'
          >
            <div className='flex items-center gap-2'>
              <svg
                className='w-5 h-5 text-red-500'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <p className='text-red-600 font-medium'>{submitError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className='mb-6'
      >
        <h1 className='text-2xl md:text-3xl font-bold text-gray-800 mb-2'>
          Add New Product
        </h1>
        <p className='text-gray-600'>
          Fill in the details below to add a new product to your inventory.
        </p>
        {pharmaciesError && !pharmaciesLoading && pharmacies.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'
          >
            <div className='flex items-center gap-3'>
              <svg
                className='w-5 h-5 text-yellow-500'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
              <div>
                <p className='font-medium text-yellow-800'>{pharmaciesError}</p>
                <button
                  onClick={() => router.push('/pharmacist/pharmacies/new')}
                  className='mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium'
                >
                  Create a Pharmacy →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
        className='space-y-6'
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-6'
          noValidate
        >
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <motion.div variants={itemVariants} className='lg:col-span-1'>
              <ProductImageUpload
                imagePreview={imagePreview}
                onImageUpload={handleImageUpload}
                onRemoveImage={removeImage}
                error={errors.image?.message}
              />
            </motion.div>

            <div className='lg:col-span-2 space-y-6'>
              <motion.div variants={itemVariants}>
                <BasicInformationForm
                  register={register}
                  errors={errors}
                  pharmacies={formattedPharmacies}
                  pharmaciesLoading={pharmaciesLoading}
                  pharmaciesError={pharmaciesError}
                  categories={CATEGORIES}
                  formatAddress={formatAddress}
                  selectedPharmacy={selectedPharmacy}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <PricingStockForm
                  register={register}
                  errors={errors}
                  control={control}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <MedicalInformationForm
                  register={register}
                  watchedRequiresPrescription={watchedRequiresPrescription}
                  errors={errors}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormActions
                  loading={loading}
                  isDirty={isDirty}
                  isValid={isValid}
                  pharmaciesLoading={pharmaciesLoading}
                  onSubmit={handleSubmit(onSubmit)}
                  onCancel={handleCancel}
                />
              </motion.div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
