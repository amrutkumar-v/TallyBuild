"""Product catalogue helpers.

Mirrors ``src/estimation/catalogue.ts``.
"""

from dataclasses import dataclass

from ..schemas import MaterialProduct
from .sample_products import SAMPLE_PRODUCTS


@dataclass(frozen=True)
class ProductCatalogue:
    products: tuple[MaterialProduct, ...]


def create_catalogue(
    products: list[MaterialProduct] | tuple[MaterialProduct, ...],
) -> ProductCatalogue:
    return ProductCatalogue(tuple(products))


def find_product(catalogue: ProductCatalogue, product_id: str) -> MaterialProduct | None:
    for product in catalogue.products:
        if product.id == product_id:
            return product
    return None


def list_products(catalogue: ProductCatalogue) -> list[MaterialProduct]:
    return list(catalogue.products)


SAMPLE_PRODUCT_CATALOGUE = create_catalogue(SAMPLE_PRODUCTS)
