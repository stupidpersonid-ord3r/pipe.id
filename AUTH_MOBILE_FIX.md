# PIPE.ID Auth Mobile Fix

This package includes the previous Settings refactor plus the mobile Login/Register positioning fix.

Changes:
- Login auth shell is explicitly vertically/horizontally centered on mobile.
- Register auth shell is explicitly vertically/horizontally centered on mobile.
- Final mobile CSS overrides the previous `.auth-shell { align-items: flex-start; }` rule.
- Flip card container margins are reset on mobile so the card is not pushed upward/downward.
- `100dvh` is retained for dynamic mobile browser viewport handling.

After replacing the files, run:

```powershell
npm run dev
npm run build
```
