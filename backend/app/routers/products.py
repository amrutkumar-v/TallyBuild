"""``GET /api/v1/products`` — the illustrative product catalogue."""

from fastapi import APIRouter

from ..errors import ApiError
from ..estimation.catalogue import SAMPLE_PRODUCT_CATALOGUE, list_products
from ..estimation.units import is_supported_unit
from ..schemas import ProductListResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
def get_products(
    category: str | None = None,
    search: str | None = None,
    unit: str | None = None,
) -> ProductListResponse:
    products = list_products(SAMPLE_PRODUCT_CATALOGUE)

    if unit is not None:
        if not is_supported_unit(unit):
            raise ApiError(
                400,
                "REQUEST_MALFORMED",
                f'Query parameter "unit" value "{unit}" is not a supported unit.',
            )
        products = [product for product in products if product.unit == unit]

    if category is not None:
        products = [product for product in products if product.category == category]

    if search is not None:
        needle = search.casefold()
        products = [
            product
            for product in products
            if needle in product.name.casefold() or needle in product.id.casefold()
        ]

    return ProductListResponse(count=len(products), products=products)
