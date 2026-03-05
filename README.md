# Roof Repair Partners - Field Estimate & Job Management

> Oklahoma's Only Repair-Focused Roofing Company

A comprehensive mobile-first web application for roofing businesses to manage estimates, jobs, crews, and referrals—all from the field or office.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-blue?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-7-purple?logo=vite)

---

## Features Overview

| Module | Description |
|--------|-------------|
| **Estimate Wizard** | Multi-step form for creating detailed repair estimates |
| **Jobs Dashboard** | Schedule jobs, assign crews, track completion |
| **Admin Dashboard** | Manage pricing, repairs, reports, and settings |
| **Referral Tracking** | Track referrals and process commission payouts |
| **Weather Integration** | Live weather with hourly forecast and roofing conditions |
| **Map View** | See all estimates on an interactive map |
| **Offline Support** | IndexedDB storage for offline capability |

---

## Estimate Creation

### Wizard Steps

1. **Customer Info** - Name, address, phone, email, roof type selection
2. **Damage Assessment** - Photo upload, shingle damage counting by layer depth
3. **Additional Repairs** - Standard repairs + custom line items
4. **Site Conditions** - Pitch multiplier, accessibility, emergency/after-hours, warranty
5. **Review & Generate** - Detailed breakdown, scope of work, PDF export

### Residential Shingle Types
- **3-Tab** - Basic asphalt shingles
- **Architectural** - Dimensional/laminate shingles
- **Premium/Designer** - High-end designer shingles

### Commercial/Flat Roofing
- TPO, EPDM, PVC, Modified Bitumen, Built-Up, Spray Foam
- Per-square-foot pricing with area calculations
- Drainage, ponding, seam, flashing, and membrane condition tracking

### Layer-Based Damage Assessment
| Depth | Description |
|-------|-------------|
| Surface | Sealant/adhesive fix only |
| 1 Layer | Shingle replacement |
| 2 Layer | Shingle + underlayment |
| 3 Layer | Shingle + underlayment + decking |

### Site Condition Multipliers

**Roof Pitch:**
| Pitch | Multiplier |
|-------|------------|
| Low (0-4/12) | 1.0x |
| Medium (5-8/12) | 1.15x |
| Steep (9-12/12) | 1.35x |
| Extreme (12+/12) | 1.5x |

**Accessibility:**
| Access Level | Multiplier |
|--------------|------------|
| Easy (single story) | 1.0x |
| Moderate (two story) | 1.15x |
| Difficult (3+ story) | 1.3x |

---

## Jobs Dashboard

Access via the **calendar icon** in the header.

### Features
- **List View** - Filter jobs by status (scheduled, today, this week, completed)
- **Calendar View** - Visual scheduling with day/week views
- **Crew Manager** - Add/edit crew members with roles, specialties, hourly rates
- **Route Planner** - Optimize daily routes with map integration

### Job Lifecycle
```
Approved → Scheduled → In Progress → Completed → Invoiced
```

### Job Details
- Schedule date/time and estimated duration
- Crew assignment
- Timeline events (status changes, notes, photos)
- Material checklists
- Completion photos and customer signature
- Invoice generation

---

## Admin Dashboard

Access via the **gear icon** in the header.

### Tabs

| Tab | Description |
|-----|-------------|
| **Pricing** | Manage shingle pricing by type and layer |
| **Repairs** | Configure additional repair types with materials/labor costs |
| **Estimates** | Search, filter, and manage all estimates |
| **Reports** | Revenue metrics, conversion rates, shingle type breakdown |
| **Settings** | Company info, multipliers, fees, warranties, service plans |

### Service Agreements
- Basic, Standard, Premium tiers
- Annual/semi-annual/quarterly/monthly billing
- Inspection scheduling and tracking
- Repair discounts and priority service

---

## Referral Tracking

Access via the **people icon** in the header.

### Features
- **Sources** - Add referrers (customers, partners, employees) with commission rates
- **Referrals** - Track referred customers through the sales pipeline
- **Payouts** - Batch process commission payments

### Referral Status Flow
```
Pending → Estimate Created → Converted → Paid Out
```

### Commission Structure
- Percentage-based commission (e.g., 5% of job total)
- Optional fixed bonus per referral
- Payment methods: Check, Cash, Transfer, Account Credit

---

## Weather Integration

The weather banner on the home screen shows:

### Current Conditions
- Temperature and "feels like"
- Weather description with icon
- Precipitation probability
- Wind speed and direction
- Roofing condition rating (Good/Fair/Caution/Poor/Hot/Cold)

### Expanded View (tap to expand)
- **Hourly Forecast** - Next 12 hours with temp, icon, and rain %
- Humidity, UV Index, Cloud Cover
- Detailed roofing recommendation

### Roofing Condition Ratings
| Status | Condition |
|--------|-----------|
| Good | Ideal for roofing |
| Fair | Chance of rain - monitor |
| Caution | High winds |
| Poor | Active precipitation |
| Hot | >95°F - take precautions |
| Cold | <40°F - shingles may be brittle |

---

## Map Integration

The **Estimates Map** on the home screen shows all estimates as pins:
- Color-coded by status (draft, sent, approved, scheduled, completed, invoiced)
- Click a pin to view estimate details
- Helps with route planning and territory overview

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app runs at `http://localhost:5173/RoofApp/`

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Styling |
| **Vite 7** | Build tool |
| **React Context** | State management |
| **localStorage** | Primary data persistence |
| **IndexedDB** | Offline storage |
| **Open-Meteo API** | Weather data |
| **OpenStreetMap** | Map tiles and geocoding |

---

## Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── NumberInput.tsx
│   │   ├── Select.tsx
│   │   ├── Toggle.tsx
│   │   └── ...
│   ├── steps/                 # Estimate wizard steps
│   │   ├── CustomerInfoStep.tsx
│   │   ├── DamageAssessmentStep.tsx
│   │   ├── AdditionalRepairsStep.tsx
│   │   ├── SiteConditionsStep.tsx
│   │   └── ReviewStep.tsx
│   ├── admin/                 # Admin dashboard components
│   │   ├── AdminDashboard.tsx
│   │   ├── PricingManager.tsx
│   │   ├── RepairsManager.tsx
│   │   ├── ReportsView.tsx
│   │   └── SettingsManager.tsx
│   ├── jobs/                  # Jobs dashboard components
│   │   ├── JobsDashboard.tsx
│   │   ├── ScheduleCalendar.tsx
│   │   ├── CrewManager.tsx
│   │   └── RoutePlanner.tsx
│   ├── referrals/             # Referral tracking components
│   │   ├── ReferralsDashboard.tsx
│   │   ├── ReferralSourceManager.tsx
│   │   ├── ReferralsList.tsx
│   │   └── PayoutManager.tsx
│   ├── EstimateWizard.tsx     # Main wizard container
│   ├── EstimateList.tsx       # Home screen with estimate list
│   ├── EstimatesMap.tsx       # Map view of estimates
│   └── WeatherBanner.tsx      # Weather display with hourly forecast
├── context/
│   ├── EstimateContext.tsx    # Estimate state management
│   ├── PricingContext.tsx     # Pricing configuration
│   ├── JobsContext.tsx        # Jobs, crews, schedules
│   └── ReferralsContext.tsx   # Referral tracking
├── data/
│   └── defaultPricing.ts      # Default pricing configuration
├── types/
│   └── index.ts               # TypeScript interfaces
├── utils/
│   ├── calculateEstimate.ts   # Pricing calculations
│   └── offlineStorage.ts      # IndexedDB utilities
└── App.tsx                    # Main app with routing
```

---

## Data Storage

| Key | Contents |
|-----|----------|
| `roofRepairPartners_estimates` | All estimates |
| `roofRepairPartners_pricing` | Pricing configuration |
| `roofapp_jobs` | Job schedules, crews, timelines |
| `roofRepairPartners_referrals` | Referral sources, referrals, payouts |

---

## Mobile-First Design

- Large touch targets (48px minimum) for use with work gloves
- Responsive layouts for phones, tablets, and desktop
- Running total always visible during estimate creation
- Camera integration for damage photos
- Auto-save to prevent data loss
- Offline capability with sync queue

---

## Status Lifecycle

### Estimates
```
Draft → Sent → Approved → Scheduled → Completed → Invoiced
                                                      ↓
                                                    Void (any state)
```

### Status Colors
| Status | Color |
|--------|-------|
| Draft | Gray |
| Sent | Blue |
| Approved | Green |
| Scheduled | Purple |
| Completed | Emerald |
| Invoiced | Amber |
| Void | Red |

---

## License

Proprietary - Roof Repair Partners

---

<p align="center">
  <strong>Roof Repair Partners</strong><br>
  Oklahoma's Only Repair-Focused Roofing Company
</p>
