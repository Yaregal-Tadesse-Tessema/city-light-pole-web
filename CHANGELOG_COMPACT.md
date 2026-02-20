# Changelog (Compact)

## 2026-02-20

- Added public accident reporting form on landing page (`/`) with no-login UX.
- Added hero CTA button to jump to the public accident form.
- Public form defaults:
  - Auto-fills current date/time.
  - Auto-attempts current GPS coordinates.
  - All defaults remain editable.
- Photo rules updated:
  - Required: at least 1 image.
  - Maximum: 3 images.
  - UI labels and validation messages updated accordingly.
- Pole ID improvements in public form:
  - Added small hint: users can find Pole ID written on the pole.
  - Added resilient pole lookup with multiple endpoint/response-shape fallbacks.
  - Falls back to manual Pole ID input if pole list is unavailable.
- Public submission hardening:
  - Public form now targets public accident-create endpoint candidates only.
  - Removed fallback to guarded create endpoint.
  - Graceful warning if accident is created but photo upload endpoint is protected.
- Reporter source tracking:
  - Added `reporterType` support (`INTERNAL` / `EXTERNAL`) in create payloads.
  - Internal flows send `INTERNAL`; public landing flow sends `EXTERNAL`.
- Issues page enhancements:
  - Added Reporter Type column.
  - Added Reporter Type filter in list view after login.
  - Added fallback derivation when backend field is missing.
- Accident list enhancements:
  - Added Reporter Type column.
  - Added Reporter Type filter.

