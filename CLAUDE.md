# RoofApp - Claude Memory

## Project Overview
Roof inspection report app built with React/TypeScript. Allows users to create inspection reports with photos, conditions, and generate PDFs.

## Recent Changes (March 2026)

### PDF Report Improvements
- **Condition badge centering**: Fixed Good/Fair/Poor badges to be properly centered horizontally and vertically within their colored containers
- **Photo orientation fix**: Added `processImageForPdf` helper that processes images through canvas to apply EXIF orientation automatically
- **Aspect ratio handling**: Images maintain their original aspect ratio using "contain" mode, centered within placeholders

### Draft & Image Persistence
- **Image compression**: Added `compressImageForStorage` helper (max 1200px width, 80% quality JPEG) to reduce localStorage usage
- **Base64 storage**: Images are stored as base64 data URLs instead of blob URLs so they persist across page reloads
- **Auto-save on unload**: Drafts are automatically saved when the page is closed/refreshed via `beforeunload` event
- **Save button**: Works correctly, stores drafts in localStorage without deleting existing drafts

### Camera Roll Save Feature
- **Auto-save to device**: Photos taken via camera are automatically saved to the device's camera roll
- **Web Share API**: Uses `navigator.share()` on mobile devices that support it
- **Download fallback**: Falls back to downloading the file on unsupported browsers
- **Capture attribute**: Added `capture="environment"` to prefer rear camera on mobile
- **File naming**: Photos saved with label and timestamp (e.g., `Front_Elevation_2026-03-27T14-30-00.jpg`)

### Image Display
- **Consistent containers**: All photo slots use 4:3 aspect ratio containers
- **Object-contain**: Images use `object-contain` to fit within containers without distortion
- **Portrait/landscape support**: Both orientations display correctly within the fixed container

## Key Files
- `src/components/reports/InspectionReport.tsx` - Main report component with all photo handling and PDF generation

## Tech Stack
- React + TypeScript
- Vite
- Tailwind CSS
- jsPDF for PDF generation
- localStorage for draft persistence
