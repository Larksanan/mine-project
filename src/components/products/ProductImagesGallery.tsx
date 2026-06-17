'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { BiChevronLeft, BiChevronRight, BiShield } from 'react-icons/bi';
import { Product } from '@/types/product';

interface ProductImagesGalleryProps {
  product: Product;
}

const ProductImagesGallery = ({ product }: ProductImagesGalleryProps) => {
  // Normalize image to always be an array
  const imageArray: string[] = Array.isArray(product.image)
    ? product.image.length > 0
      ? product.image
      : ['/placeholder-medicine.jpg']
    : product.image
      ? [product.image]
      : ['/placeholder-medicine.jpg'];

  const [mainImage, setMainImage] = useState<string>(imageArray[0]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    const newIndex = (currentImageIndex + 1) % imageArray.length;
    setCurrentImageIndex(newIndex);
    setMainImage(imageArray[newIndex]);
  };

  const prevImage = () => {
    const newIndex =
      (currentImageIndex - 1 + imageArray.length) % imageArray.length;
    setCurrentImageIndex(newIndex);
    setMainImage(imageArray[newIndex]);
  };

  const getStockStatus = () => {
    if (!product.inStock) {
      return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50' };
    }
    if (product.stockQuantity <= (product.minStockLevel || 10)) {
      return {
        text: `Low Stock (${product.stockQuantity} left)`,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
      };
    }
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const stockStatus = getStockStatus();
  const discountPercentage = product.discountPercentage || 0;

  return (
    <div className='space-y-6'>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className='relative rounded-xl overflow-hidden bg-white shadow-md'
      >
        <div className='w-full h-96 relative'>
          <Image
            src={mainImage || '/placeholder-medicine.jpg'}
            fill
            className='object-contain p-8'
            alt={product.name}
            sizes='(max-width: 768px) 100vw, 50vw'
            onError={e => {
              e.currentTarget.src = '/placeholder-medicine.jpg';
            }}
          />
        </div>

        {imageArray.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className='absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md'
              aria-label='Previous image'
            >
              <BiChevronLeft size={24} />
            </button>
            <button
              onClick={nextImage}
              className='absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md'
              aria-label='Next image'
            >
              <BiChevronRight size={24} />
            </button>
          </>
        )}

        {/* Stock Status Badge */}
        <div
          className={`absolute top-4 left-4 ${stockStatus.bg} ${stockStatus.color} px-3 py-1 rounded-full text-sm font-medium`}
        >
          {stockStatus.text}
        </div>

        {discountPercentage > 0 && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className='absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium'
          >
            -{discountPercentage}%
          </motion.div>
        )}

        {/* Prescription Required Badge */}
        {product.requiresPrescription && (
          <div className='absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1'>
            <BiShield size={16} />
            Prescription Required
          </div>
        )}
      </motion.div>

      {imageArray.length > 1 && (
        <div className='grid grid-cols-4 gap-3'>
          {imageArray.map((img: string, index: number) => (
            <motion.div
              key={index}
              onClick={() => {
                setMainImage(img);
                setCurrentImageIndex(index);
              }}
              className={`cursor-pointer rounded-lg overflow-hidden bg-white border-2 ${
                currentImageIndex === index
                  ? 'border-blue-500'
                  : 'border-transparent'
              }`}
              whileHover={{ scale: 1.06 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.05 * index,
                type: 'spring',
                stiffness: 300,
              }}
            >
              <div className='w-full h-20 relative'>
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className='object-contain p-2'
                  sizes='(max-width: 768px) 25vw, 10vw'
                  onError={e => {
                    e.currentTarget.src = '/placeholder-medicine.jpg';
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImagesGallery;
