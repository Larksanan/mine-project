'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import ProductCard from './ProductCard';
import useCartContext, { type CartContextType } from '@/context/CartContext';

interface ProductGridProps {
  products: Product[];
}
export default function ProductGrid({ products }: ProductGridProps) {
  const router = useRouter();
  const { addToCart } = useCartContext() as CartContextType;
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handleAddToCart = (product: Product) => {
    const quantity =
      quantities[(product._id as string) || (product.id as string)] || 1;
    addToCart({
      _id: product._id || product.id || '',
      name: product.name,
      image: Array.isArray(product.image) ? product.image[0] : product.image,
      price: product.price,
      quantity,
      requiresPrescription: product.requiresPrescription,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity,
    });
  };

  const handleBuyNow = (product: Product) => {
    handleAddToCart(product);
    router.push('/shop/my-cart');
  };

  return (
    <section
      id='Projects'
      className='w-fit mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
                 justify-items-center gap-y-20 gap-x-14 mt-10 mb-5'
    >
      {products.map((product, index) => {
        const productId = product._id || product.id;

        return (
          <ProductCard
            key={`${productId}-${index}`}
            product={product}
            index={index}
            quantity={quantities[productId as string] || 1}
            onQuantityChange={value =>
              handleQuantityChange(productId as string, value)
            }
            onAddToCart={() => handleAddToCart(product)}
            onBuyNow={() => handleBuyNow(product)}
          />
        );
      })}
    </section>
  );
}
