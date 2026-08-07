# RoofApp - Claude Memory

## Project Overview
Roof inspection report app built with React/TypeScript. Allows field inspectors to create inspection reports with photos, conditions, generate PDFs, and produce professional bid documents. Multi-user via Firebase.

## Active Branch
`claude/roof-repair-estimate-app-PZHej` — all work done in this branch, not yet merged to main.

---

## August 2026 Session — Security Audit + New Features

### Critical Security Fixes
- **GHL API key moved server-side**: Created `netlify/functions/ghl-proxy.ts` — all GoHighLevel API calls now route through this Netlify Function. Frontend (`src/services/gohighlevel.ts`) calls `/.netlify/functions/ghl-proxy` with `{ action, data }` instead of hitting the API directly. API key never exposed to client.
- **Firebase orphan file cleanup**: `src/hooks/useFirebaseReports.ts` now tracks in-progress uploads with a `pendingUploadsRef` (Map of reportId → storagePaths). If Firestore write fails after storage upload, orphaned files are deleted.
- **Rate limiting**: Created `src/utils/rateLimiter.ts` with sliding window algorithm and exponential backoff. Applied `rateLimitedFetch` to `src/utils/reverseGeocode.ts` (Nominatim) and geocoding in `src/components/EstimatesMap.tsx`.

### High Priority Fixes
- **Accessibility**: `src/components/ui/Input.tsx` and `Select.tsx` now emit `aria-invalid`, `aria-describedby`, and proper `role` attributes on error.
- **Shared ID generation**: `src/utils/generateId.ts` — eliminates duplicate report/estimate number generation logic.
- **Toast notifications**: `src/components/ui/Toast.tsx` — full toast system with `ToastProvider` and `useToast` hook. Wired into `src/App.tsx`.
- **Error boundary**: `src/components/ErrorBoundary.tsx` — catches render errors, shows Try Again / Refresh Page UI. Wraps the entire app in `App.tsx`.
- **Error tracking**: `src/utils/errorTracking.ts` — logs errors to localStorage (capped at 50), registers global `window.onerror` and `unhandledrejection` handlers. Hook for future Sentry integration.
- **Secure storage**: `src/utils/secureStorage.ts` — XOR + base64 obfuscation for PII in localStorage (customer name, email, phone, address). Not true encryption — comment notes production should use a real crypto lib.
- **Input validation**: `src/utils/security.ts` — strengthened email regex, phone digit validation, ZIP format checking.
- **Mobile layout**: Grid breakpoints fixed in `DamageAssessmentStep.tsx`, `ReviewStep.tsx` etc. (e.g., `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`).

### Report Section Change
- **Recommended Action moved to top**: In `src/components/reports/InspectionReport.tsx`, the "Recommended Action / description" block now appears **above** the inspection photos in all three places: jsPDF generation, live preview, and the hidden print template.
- **Auto-adjust text**: Removed the 3-line `.slice(0, 3)` truncation. PDF now calculates block height from actual line count: `const actionBlockH = Math.max(20, 12 + actionLines.length * 4)`.

### New Feature: Generate Bid PDF
Added a professional bid PDF generator to `src/components/reports/InspectionReport.tsx`:

**UI**: "Generate Bid" button (navy) in header toolbar, immediately left of the violet "Download PDF" button.

**Flow**:
1. Click "Generate Bid" → modal opens
2. Enter: Option letter (A/B/C/D), option title, total investment price ($)
3. Scope preview shown from the Recommended Action field
4. Click "Generate Bid" → jsPDF creates the PDF → preview modal opens
5. Click "Download Bid" → saves as `RRP-Bid-OptionA-[address].pdf`

**PDF design** (matches Roof Repair Partners bid template):
- Header: company logo left + vertical divider + "ROOF REPAIR" (navy) + "OPTION" (red) with red underline
- Company name split two-color (navy/red) under logo
- Subtitle centered + property address with em-dashes
- Dark navy option block: "OPTION A | ROOF REPAIR & MAINTENANCE"
- Line items: parsed from `recommendedAction` field (one item per non-empty line, first sentence = bold title, rest = description). Each has a navy circle with white geometric icon (6 rotating styles: shingles, nail, caulk tube, clipboard, broom, ridge cap)
- Total Investment bar (navy) with large white price
- Three trust badges with shield icons
- "*This proposal is valid for 30 days" italic footer

**New state variables added** (in `InspectionReport`):
```ts
const [showBidModal, setShowBidModal] = useState(false);
const [bidPrice, setBidPrice] = useState('');
const [bidOption, setBidOption] = useState('A');
const [bidTitle, setBidTitle] = useState('Roof Repair & Maintenance');
const [isGeneratingBid, setIsGeneratingBid] = useState(false);
const [showBidPreview, setShowBidPreview] = useState(false);
const [bidBlobUrl, setBidBlobUrl] = useState<string | null>(null);
```

**Module-level helpers added** (before `export function InspectionReport`):
- `parseBidLineItems(scope: string)` — splits scope text by newlines, strips bullets/numbers, extracts title (first sentence) + description (rest)
- `drawBidIcon(pdf, cx, cy, index)` — draws white geometric icon inside navy circle using jsPDF primitives

---

## Key Files (Full List)

| File | Purpose |
|------|---------|
| `src/components/reports/InspectionReport.tsx` | Main report + bid PDF generation (2600+ lines) |
| `src/lib/firebase.ts` | Firebase init and config |
| `src/contexts/AuthContext.tsx` | Auth context (login/logout) |
| `src/services/gohighlevel.ts` | GHL CRM — now proxied via Netlify |
| `src/services/reportService.ts` | Firestore CRUD |
| `src/services/storageService.ts` | Firebase Storage photo uploads |
| `src/hooks/useFirebaseReports.ts` | Firebase report operations + orphan cleanup |
| `src/hooks/useGHL.ts` | GHL hook (locationId removed, now server-side) |
| `src/components/auth/AuthScreen.tsx` | Login/signup UI |
| `src/components/ui/Toast.tsx` | Toast notification system |
| `src/components/ui/Input.tsx` | Accessible form input |
| `src/components/ui/Select.tsx` | Accessible form select |
| `src/components/ErrorBoundary.tsx` | React error boundary |
| `src/utils/errorTracking.ts` | Error logging utility |
| `src/utils/secureStorage.ts` | Obfuscated localStorage for PII |
| `src/utils/generateId.ts` | Shared ID/number generation |
| `src/utils/rateLimiter.ts` | Rate limiting with exponential backoff |
| `src/utils/security.ts` | Input validation (email, phone, ZIP) |
| `netlify/functions/ghl-proxy.ts` | Server-side GHL API proxy |
| `src/App.tsx` | App root — ErrorBoundary + ToastProvider |

---

## Earlier Changes (March 2026)

### PDF Report Improvements
- Condition badge centering fixed
- `processImageForPdf` helper applies EXIF orientation via canvas
- Images maintain aspect ratio ("contain" mode) in PDF

### Draft & Image Persistence
- `compressImageForStorage` (max 1200px, 80% JPEG quality)
- Base64 data URLs for persistence across reloads
- Auto-save on `beforeunload`

### Camera Roll Save Feature
- `navigator.share()` on mobile, download fallback on desktop
- `capture="environment"` for rear camera
- Files named `Label_timestamp.jpg`

### Firebase Integration
- Firebase Auth (email/password)
- Firestore real-time sync across all users
- Firebase Storage for photos

---

## Tech Stack
- React + TypeScript (Vite)
- Tailwind CSS
- jsPDF ^4.1.0 — dynamically imported for PDF generation
- Firebase (Auth, Firestore, Storage)
- Netlify Functions (server-side API proxy)

## Environment Variables (Netlify)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
GHL_API_KEY          ← server-side only, never VITE_ prefix
GHL_LOCATION_ID      ← server-side only
```

## Known / Remaining
- `src/utils/syncQueue.ts` — `processSyncQueue()` deletes from queue but doesn't actually sync to backend. Marked as incomplete. Could be wired to real sync endpoint later.
- No Sentry/LogRocket integration yet — `errorTracking.ts` has a TODO comment with stub code.
- `secureStorage.ts` uses XOR obfuscation, not real encryption — noted for production upgrade.
- Color palette not fully consolidated in `tailwind.config.js` — multiple blue shades still in use.
