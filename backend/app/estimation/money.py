"""Currency rounding for the estimation core.

Mirrors ``src/estimation/money.ts`` bit-for-bit. The shared expression is what
keeps the Python and TypeScript results identical; do not substitute
``round()`` (banker's rounding) or ``Decimal`` here unless the frontend core is
changed in lockstep.
"""

import math
import sys

CURRENCY_DECIMALS = 2


def round_currency(value: float) -> float:
    """Round a rupee amount to paise using half-up rounding.

    Non-finite input is returned unchanged so the caller can surface a
    ``NON_FINITE_RESULT`` error instead of raising.
    """
    if not math.isfinite(value):
        return value
    factor = 10**CURRENCY_DECIMALS
    return math.floor((value + sys.float_info.epsilon) * factor + 0.5) / factor
