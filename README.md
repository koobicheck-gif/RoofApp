# Roof Repair Partners - Field Estimate Tool

> Oklahoma's Only Repair-Focused Roofing Company

A mobile-first web application for field technicians to quickly generate accurate roof repair estimates on-site.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-blue?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-7-purple?logo=vite)

---

## Features

### Shingle Damage Assessment
- **Photo Upload** - Capture and attach photos of damaged areas directly from the field
- **Layer-Based Counting** - Track damage by repair depth:
  - Surface only (sealant/adhesive fix)
  - 1 Layer (shingle replacement)
  - 2 Layer (shingle + underlayment)
  - 3 Layer (shingle + underlayment + decking)

### Shingle Type Pricing
| Type | Surface | 1 Layer | 2 Layer | 3 Layer |
|------|---------|---------|---------|---------|
| 3-Tab | $10.00 | $15.50 | $24.00 | $50.00 |
| Architectural | $11.00 | $19.50 | $28.50 | $56.00 |
| Premium/Designer | $15.00 | $25.00 | $38.00 | $73.00 |

### Additional Repairs
- Pipe boot/collar replacement
- Flashing repair
- Ridge cap repair
- Roof vent replacement
- Chimney flashing
- Valley repair
- Sealant/caulking work
- Gutter reattachment
- Skylight seal repair
- Turbine vent replacement
- **Custom repairs** with manual pricing

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

### Fees & Options
- Minimum service call: $150.00
- Emergency/same-day: +$125.00
- After-hours: +$175.00
- Extended warranties available

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Estimate Workflow

```
┌─────────────────┐
│  1. Customer    │  Enter name, address, phone, email
│     Info        │  Select shingle type
└────────┬────────┘
         │
┌────────▼────────┐
│  2. Damage      │  Upload photos
│     Assessment  │  Count damaged shingles by layer
└────────┬────────┘
         │
┌────────▼────────┐
│  3. Additional  │  Select standard repairs
│     Repairs     │  Add custom repairs if needed
└────────┬────────┘
         │
┌────────▼────────┐
│  4. Site        │  Roof pitch
│     Conditions  │  Accessibility
└────────┬────────┘  Emergency/after-hours toggles
         │           Warranty selection
┌────────▼────────┐
│  5. Review &    │  Detailed or customer view
│     Generate    │  Add tech notes
└─────────────────┘  Save estimate
```

---

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Vite** - Build tool
- **Context API** - State management
- **LocalStorage** - Data persistence

---

## Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── NumberInput.tsx
│   │   ├── Select.tsx
│   │   └── Toggle.tsx
│   ├── steps/              # Wizard step components
│   │   ├── CustomerInfoStep.tsx
│   │   ├── DamageAssessmentStep.tsx
│   │   ├── AdditionalRepairsStep.tsx
│   │   ├── SiteConditionsStep.tsx
│   │   └── ReviewStep.tsx
│   ├── EstimateWizard.tsx  # Main wizard container
│   └── EstimateList.tsx    # Estimate list view
├── context/
│   ├── PricingContext.tsx  # Pricing state management
│   └── EstimateContext.tsx # Estimate state management
├── data/
│   └── defaultPricing.ts   # Default pricing configuration
├── types/
│   └── index.ts            # TypeScript interfaces
├── utils/
│   └── calculateEstimate.ts # Calculation logic
└── App.tsx                 # Main app component
```

---

## Roadmap

- [x] **Phase 1** - Pricing engine + calculator + estimate generation
- [ ] **Phase 2** - Photo upload + PDF generation
- [ ] **Phase 3** - Admin dashboard + pricing management
- [ ] **Phase 4** - Job tracking + reporting
- [ ] **Phase 5** - Offline mode + sync

---

## Mobile-First Design

- Large touch targets (48px minimum) for use with work gloves
- Responsive layouts that work on phones and tablets
- Running total always visible
- Camera integration for damage photos
- Auto-save to prevent data loss

---

## License

Proprietary - Roof Repair Partners

---

<p align="center">
  <strong>Roof Repair Partners</strong><br>
  Oklahoma's Only Repair-Focused Roofing Company
</p>
