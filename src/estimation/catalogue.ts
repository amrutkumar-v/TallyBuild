import { SAMPLE_PRODUCTS } from './data/sampleProducts';
import type { MaterialProduct } from './types';

export interface ProductCatalogue {
  readonly products: readonly MaterialProduct[];
}

export function createCatalogue(products: readonly MaterialProduct[]): ProductCatalogue {
  return { products };
}

export function findProduct(
  catalogue: ProductCatalogue,
  productId: string,
): MaterialProduct | undefined {
  return catalogue.products.find((product) => product.id === productId);
}

export function listProducts(catalogue: ProductCatalogue): readonly MaterialProduct[] {
  return catalogue.products;
}

export const SAMPLE_PRODUCT_CATALOGUE: ProductCatalogue = createCatalogue(SAMPLE_PRODUCTS);
