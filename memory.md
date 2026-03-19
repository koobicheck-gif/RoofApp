# Development Notes

## 2026-03-19

### Changes Made

**Logo Upload in Settings**
- Added `logoUrl` field to `CompanyInfo` type
- Created logo upload UI in Settings with preview and remove functionality
- Logo stored in localStorage as base64 data URL
- Logo now displays in app header and PDF reports dynamically

**Removed Hardcoded Tagline**
- Removed "Oklahoma's Only Repair-Focused Roofing Company" from hardcoded locations
- Tagline is now optional and configurable in Settings
- If tagline is empty, it won't render in header/PDF

**PDF Badge Formatting Fixes**
- Fixed "Overall Condition" badge (Good/Fair/Poor) - changed from `span` to `div` with `display: inline-block` and proper `verticalAlign: 'middle'`
- Fixed photo condition badges - increased padding, font size, and added `lineHeight` for better rendering
- Key insight: `span` elements with inline styles don't render well in html2canvas; use `div` with `inline-block` instead

### Files Modified
- `src/types/index.ts` - Added `logoUrl?: string` to CompanyInfo
- `src/components/admin/SettingsManager.tsx` - Added logo upload/remove UI
- `src/components/EstimateList.tsx` - Dynamic logo and company info from localStorage
- `src/components/reports/InspectionReport.tsx` - Dynamic logo, fixed badge formatting

**Reports Page Pro UI/UX**
- Renamed "Owner Name" to "Client Name" throughout form and PDF
- Added professional split-screen layout:
  - Left side: scrollable form section
  - Right side: sticky live preview panel (desktop only, lg+ breakpoint)
- Live preview shows scaled (58%) PDF that updates in real-time as you type
- Enhanced header with gradient icon, photo count indicator
- Preview shows first 4 photos with "+X more photos in full PDF" indicator
- Dynamic company name in PDF footer (was hardcoded "Roof Repair Partners")

**Weather Banner - Live Radar**
- Added collapsible "Live Radar" section in weather dropdown
- Initially used RainViewer API for radar tiles
- Changed to News 9 Oklahoma (KWTV) NextGen Live Radar iframe
- Added "Open News 9 Radar" button as fallback (opens in new tab)
- Shows KWTV Oklahoma City branding

**Satellite Maps for Estimates & Job Tracking**
- EstimatesMap: Switched from OpenStreetMap to Esri World Imagery satellite tiles
- Added street/place labels overlay on satellite view
- GoogleRouteMap (Route Planner): Changed from roadmap to hybrid view (satellite + labels)
- Enabled map type control in Google Maps to allow switching views
- Both maps now show aerial view of job sites for better roof/property assessment

### Files Modified
- `src/components/WeatherBanner.tsx` - Added News 9 radar iframe, removed RainViewer API
- `src/components/EstimatesMap.tsx` - Esri satellite tiles + labels overlay
- `src/components/jobs/GoogleRouteMap.tsx` - Hybrid satellite view, map type control
