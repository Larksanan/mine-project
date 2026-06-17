/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ProductReviewPageContent from '@/components/products/ProductReviewPageContent';
import Loading from '@/components/Loading';
import ErrorComponent from '@/components/Error';
import { Product } from '@/types/product';

export default function ProductReviewPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : null;

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!id || id === 'undefined' || id === 'null') {
        throw new Error('Product ID is missing');
      }
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid product ID format');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/products/user/${id}`);

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        } else if (response.status === 400) {
          throw new Error('Invalid product ID');
        } else if (response.status === 500) {
          throw new Error('Server error occurred');
        } else {
          throw new Error(`Failed to fetch product: ${response.status}`);
        }
      }

      const responseData = await response.json();
      let productData: any = null;

      if (responseData.success === true) {
        if (responseData.data && typeof responseData.data === 'object') {
          productData = responseData.data;
        } else if (responseData.product) {
          productData = responseData.product;
        }
      } else if (responseData._id) {
        productData = responseData;
      } else if (responseData.data && responseData.data._id) {
        productData = responseData.data;
      }

      if (productData) {
        const normalizedProduct: Product = {
          _id: productData._id || productData.id || '',
          id: productData.id || productData._id || '',
          name: productData.name || 'Unnamed Product',
          price: productData.price || 0,
          costPrice: productData.costPrice || 0,
          description: productData.description || '',
          category: productData.category || 'Uncategorized',
          image:
            productData.image ||
            productData.images?.[0] ||
            '/placeholder-medicine.jpg',
          inStock:
            productData.inStock !== undefined ? productData.inStock : false,
          stockQuantity: productData.stockQuantity || 0,
          minStockLevel: productData.minStockLevel || 0,
          manufacturer: productData.manufacturer || 'Unknown',
          requiresPrescription: productData.requiresPrescription || false,
          isControlledSubstance: productData.isControlledSubstance || false,
          sideEffects: productData.sideEffects || '',
          dosage: productData.dosage || '',
          activeIngredients: productData.activeIngredients || '',
          barcode: productData.barcode || '',
          sku: productData.sku || 'N/A',
          discountPercentage: productData.discountPercentage || 0,
          features: productData.features || [],
          expiryDate: productData.expiryDate,
          batchNumber: productData.batchNumber,
          storageConditions: productData.storageConditions,
          weight: productData.weight,
          dimensions: productData.dimensions,
          pharmacy: productData.pharmacy || {
            name: '',
            id: '',
          },
        };
        if (!normalizedProduct._id || !normalizedProduct.name) {
          throw new Error('Invalid product data: missing required fields');
        }

        setProduct(normalizedProduct);
      } else {
        console.warn('Product data is invalid or empty:', responseData);
        throw new Error('Product data not found in response');
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load product');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRelatedProducts = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/products/user/`);

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        setRelatedProducts([]);
        return;
      }

      const data = await response.json();
      let productsArray: any[] = [];

      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && typeof data === 'object') {
        if (data.success && data.data && data.data.products) {
          productsArray = data.data.products;
        } else if (data.success && Array.isArray(data.data)) {
          productsArray = data.data;
        } else if (Array.isArray(data.products)) {
          productsArray = data.products;
        } else if (Array.isArray(data.data)) {
          productsArray = data.data;
        } else if (Array.isArray(data.items)) {
          productsArray = data.items;
        } else if (Array.isArray(data.result)) {
          productsArray = data.result;
        }
      }
      const normalizedProducts: Product[] = productsArray
        .filter((p: any) => p && (p._id || p.id))
        .map((p: any) => ({
          _id: p._id || p.id || '',
          id: p.id || p._id || '',
          name: p.name || 'Unnamed Product',
          price: p.price || 0,
          costPrice: p.costPrice || 0,
          description: p.description || '',
          category: p.category || 'Uncategorized',
          image: p.image || p.images?.[0] || '/placeholder-medicine.jpg',
          inStock: p.inStock !== undefined ? p.inStock : false,
          stockQuantity: p.stockQuantity || 0,
          minStockLevel: p.minStockLevel || 0,
          manufacturer: p.manufacturer || 'Unknown',
          requiresPrescription: p.requiresPrescription || false,
          isControlledSubstance: p.isControlledSubstance || false,
          sideEffects: p.sideEffects || '',
          dosage: p.dosage || '',
          activeIngredients: p.activeIngredients || '',
          barcode: p.barcode || '',
          sku: p.sku || 'N/A',
          discountPercentage: p.discountPercentage || 0,
          features: p.features || [],
          expiryDate: p.expiryDate,
          batchNumber: p.batchNumber,
          storageConditions: p.storageConditions,
          weight: p.weight,
          dimensions: p.dimensions,
          pharmacy: p.pharmacy || {
            name: '',
            id: '',
          },
        }));

      setRelatedProducts(
        normalizedProducts.filter((p: Product) => p._id !== id).slice(0, 4)
      );
    } catch (err) {
      console.error('Failed to load related products:', err);
      setRelatedProducts([]);
    }
  }, [id]);

  useEffect(() => {
    if (id && id !== 'undefined' && id !== 'null') {
      fetchProduct();
      fetchRelatedProducts();
    } else {
      setError('Product ID is missing or invalid');
      setLoading(false);
    }
  }, [fetchProduct, fetchRelatedProducts, id]);
  if (loading) return <Loading />;
  if (error) return <ErrorComponent message={error} />;
  if (!product) return <ErrorComponent message='Product not found' />;

  return (
    <ProductReviewPageContent
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
