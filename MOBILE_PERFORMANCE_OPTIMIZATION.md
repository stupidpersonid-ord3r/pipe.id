# PIPE.ID Mobile Performance Optimization

This update keeps the existing UI and features while reducing unnecessary work on mobile.

## Changes
- All Trades renders 50 rows per page instead of rendering the full trade list at once.
- Automatic refresh updates backend API data in-place instead of reloading the entire SPA.
- Profile/Security/Appearance settings do not download the full trade dataset. The Data settings page still loads trades so Excel/PDF export continues to work.
- Trade queries request only the fields used by the app/export instead of `select(*)`.
- Trade pagination keeps a stable secondary `id` ordering.
- Dashboard statistics are calculated in one pass instead of several full-array filters/reductions.
- Charts equity-curve calculation avoids repeatedly cloning the growing result array.

No visual redesign, database schema change, trade deletion, or feature removal is included.
