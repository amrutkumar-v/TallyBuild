"""Illustrative sample catalogue.

Mirrors ``src/estimation/data/sampleProducts.ts``. Every price is demo data and
must never be presented as a verified market price.
"""

from ..schemas import MaterialProduct, PriceSource

ILLUSTRATIVE_PRICE_SOURCE_LABEL = "Illustrative demo data — not a verified market price"

SAMPLE_PRICE_DATE = "2026-09-01"


def _illustrative_source(price_date: str) -> PriceSource:
    return PriceSource(
        label=ILLUSTRATIVE_PRICE_SOURCE_LABEL,
        priceDate=price_date,
        currency="INR",
        isIllustrative=True,
    )


SAMPLE_PRODUCTS: list[MaterialProduct] = [
    MaterialProduct(
        id="cement-opc-53-grade",
        name="OPC 53 Grade Cement",
        category="Cement",
        unit="bag",
        unitPrice=410,
        priceSource=_illustrative_source(SAMPLE_PRICE_DATE),
    ),
    MaterialProduct(
        id="steel-tmt-fe500",
        name="TMT Steel Bar Fe500",
        category="Steel",
        unit="tonne",
        unitPrice=68000,
        priceSource=_illustrative_source(SAMPLE_PRICE_DATE),
    ),
    MaterialProduct(
        id="brick-red-clay",
        name="Red Clay Brick",
        category="Masonry",
        unit="piece",
        unitPrice=9,
        priceSource=_illustrative_source(SAMPLE_PRICE_DATE),
    ),
    MaterialProduct(
        id="block-aac-600x200x100",
        name="AAC Block 600×200×100 mm",
        category="Masonry",
        unit="piece",
        unitPrice=55,
        priceSource=_illustrative_source(SAMPLE_PRICE_DATE),
    ),
    MaterialProduct(
        id="sand-river",
        name="River Sand",
        category="Aggregates",
        unit="m3",
        unitPrice=2400,
        priceSource=_illustrative_source(SAMPLE_PRICE_DATE),
    ),
    MaterialProduct(
        id="aggregate-20mm",
        name="Coarse Aggregate 20 mm",
        category="Aggregates",
        unit="m3",
        unitPrice=1900,
        priceSource=_illustrative_source(SAMPLE_PRICE_DATE),
    ),
    MaterialProduct(
        id="tile-ceramic-floor",
        name="Ceramic Floor Tile",
        category="Finishes",
        unit="m2",
        unitPrice=620,
        priceSource=_illustrative_source(SAMPLE_PRICE_DATE),
    ),
    MaterialProduct(
        id="binding-wire-18g",
        name="Binding Wire 18 G",
        category="Steel",
        unit="kg",
        unitPrice=78,
        priceSource=_illustrative_source(SAMPLE_PRICE_DATE),
    ),
    MaterialProduct(
        id="door-frame-teak",
        name="Teak Door Frame",
        category="Joinery",
        unit="each",
        unitPrice=3600,
        priceSource=_illustrative_source(SAMPLE_PRICE_DATE),
    ),
]
