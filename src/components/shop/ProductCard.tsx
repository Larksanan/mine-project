'use client';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string[];
}

export default function ProductCard({ product }: { product: Product }) {
  // Normalize image to always be an array (same pattern as ProductImagesGallery)
  const imageArray: string[] = Array.isArray(product.image)
    ? product.image.length > 0
      ? product.image
      : ['/placeholder-medicine.jpg']
    : product.image
      ? [product.image]
      : ['/placeholder-medicine.jpg'];

  const imageSrc = imageArray[0];

  return (
    <Link href={`/shop/pharmacy/${product._id}/`}>
      <div className='border rounded-lg overflow-hidden hover:shadow-lg transition'>
        <div className='relative bg-gray-100 h-48 w-full'>
          <Image
            src={imageSrc}
            fill
            className='object-contain p-4'
            alt={product.name || 'product'}
            sizes='(max-width: 768px) 100vw, 33vw'
            onError={e => {
              e.currentTarget.src = '/placeholder-medicine.jpg';
            }}
          />
        </div>
        <div className='p-4'>
          <h3 className='text-lg font-semibold'>{product.name}</h3>
          <p className='text-orange-600 font-bold mt-1'>Rs.{product.price}</p>
        </div>
      </div>
    </Link>
  );
}
