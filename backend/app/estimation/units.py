"""Canonical measurement units and their families.

Mirrors ``src/estimation/units.ts``. Pricing requires an exact unit match; the
engine never applies conversion factors.
"""

from typing import Final, Literal

MeasurementUnit = Literal["bag", "piece", "each", "kg", "tonne", "m", "m2", "m3"]

UnitFamily = Literal["discrete", "mass", "length", "area", "volume"]

SUPPORTED_UNITS: Final[tuple[MeasurementUnit, ...]] = (
    "bag",
    "piece",
    "each",
    "kg",
    "tonne",
    "m",
    "m2",
    "m3",
)

_UNIT_FAMILY: Final[dict[str, UnitFamily]] = {
    "bag": "discrete",
    "piece": "discrete",
    "each": "discrete",
    "kg": "mass",
    "tonne": "mass",
    "m": "length",
    "m2": "area",
    "m3": "volume",
}

_UNIT_LABEL: Final[dict[str, str]] = {
    "bag": "bag",
    "piece": "piece",
    "each": "each",
    "kg": "kg",
    "tonne": "tonne",
    "m": "m",
    "m2": "m²",
    "m3": "m³",
}


def is_supported_unit(value: object) -> bool:
    """Return ``True`` when ``value`` is one of the supported unit strings."""
    return isinstance(value, str) and value in SUPPORTED_UNITS


def get_unit_family(unit: str) -> UnitFamily:
    """Return the physical family a supported unit belongs to."""
    return _UNIT_FAMILY[unit]


def get_unit_label(unit: str) -> str:
    """Return the display label for a supported unit."""
    return _UNIT_LABEL[unit]


def are_units_compatible(a: str, b: str) -> bool:
    """Return ``True`` when two supported units share the same family."""
    return _UNIT_FAMILY.get(a) == _UNIT_FAMILY.get(b) and a in _UNIT_FAMILY
