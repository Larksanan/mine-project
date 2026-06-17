'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BiArrowBack } from 'react-icons/bi';
import useCartContext, { CartContextType } from '@/context/CartContext';
import ProductImagesGallery from './ProductImagesGallery';
import ProductDetails from './ProductDetails';
import ProductSpecifications from './ProductSpecifications';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';
import { Product } from '@/types/product';

interface ProductReviewPageContentProps {
  product: Product;
  relatedProducts: Product[];
}

const ProductReviewPageContent = ({
  product,
  relatedProducts,
}: ProductReviewPageContentProps) => {
  const router = useRouter();
  const { addToCart } = useCartContext() as CartContextType;
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!product.inStock) {
      alert('This product is out of stock');
      return;
    }

    if (product.requiresPrescription) {
      alert(
        'This product requires a prescription. Please consult with a pharmacist.'
      );
      return;
    }

    // Ensure _id exists before adding to cart
    if (!product._id && !product.id) {
      alert('Invalid product. Please try again.');
      return;
    }

    const productToAdd = {
      _id: product._id || product.id || '',
      name: product.name,
      image: Array.isArray(product.image) ? product.image[0] : product.image,
      price: product.price,
      quantity: quantity,
      requiresPrescription: product.requiresPrescription,
    };
    addToCart(productToAdd);
    setQuantity(1);
    router.push('/shop/buy-now');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/shop/my-cart');
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > product.stockQuantity) {
      setQuantity(product.stockQuantity);
      return;
    }
    setQuantity(newQuantity);
  };

  return (
    <div className='bg-gray-50 min-h-screen'>
      {/* Navigation Breadcrumb */}
      <div className='bg-white py-4 px-6 md:px-16 lg:px-32 border-b'>
        <div className='flex items-center text-sm text-gray-600'>
          <Link href='/' className='hover:text-blue-600'>
            Home
          </Link>
          <span className='mx-2'>/</span>
          <Link href='/shop' className='hover:text-blue-600'>
            Pharmacy
          </Link>
          <span className='mx-2'>/</span>
          <span className='text-blue-600'>{product.name}</span>
        </div>
      </div>

      {/* Main Product Section */}
      <div className='px-6 md:px-16 lg:px-32 py-10 max-w-7xl mx-auto'>
        <button
          className='flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-8'
          onClick={() => router.back()}
        >
          <BiArrowBack size={20} />
          <span className='font-medium'>Back to products</span>
        </button>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
          {/* Product Images */}
          <ProductImagesGallery product={product} />

          {/* Product Details */}
          <ProductDetails
            product={product}
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        </div>

        {/* Product Specifications */}
        <ProductSpecifications product={product} />

        {/* Reviews Section */}
        <ProductReviews />

        {/* Related Products */}
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
};

export default ProductReviewPageContent;
