# Cart module

Owns persisted carts and cart lines, including guest-cart ownership and authenticated-cart merging.

CRT-01 adds the read-only validation endpoint `POST /api/v1/cart/validate`:
it reprices every line server-side (variant price override, active product
promotion, base price), checks stock (`stock - reservedStock`) and coupon
eligibility, and returns the list of discrepancies. No amount coming from the
client is ever used. See `docs/backend/cart.md` for the full contract.
