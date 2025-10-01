# Diet Plan Download & Navigation Feature

## Overview
Enhanced the diet plan feature to provide better UX with:
1. **Separate detail page** - No more scrolling within dashboard section
2. **PDF/Print download** - Export diet plans as PDF
3. **Card-based list view** - Clean, organized presentation

## Changes Made

### 1. Diet Plans Section UI Updates

#### Mentor Section (`diet-plans-section.tsx`)
- Added "View" button to each diet plan card
- Opens diet plan in new tab (`/dashboard/diet-plan/[id]`)
- Better organized layout without inline content

#### User Section (`user/sections/diet-plans-section.tsx`)
- Replaced sidebar + viewer layout with responsive card grid
- Each card shows title, description, mentor, creation date, and tags
- "View Diet Plan" button opens detail page in new tab
- Cleaner, more modern design

### 2. New Diet Plan Detail Page

**File**: `src/app/dashboard/diet-plan/[id]/page.tsx`

Features:
- Full-page diet plan viewer
- Metadata display (mentor, student, date, tags)
- "Back" button for navigation
- "Download PDF" button
- Responsive layout (max-width: 4xl)
- Works for both mentors and students

### 3. API Endpoints

#### `GET /api/diet-plans/[id]`
**File**: `src/app/api/diet-plans/[id]/route.ts`

- Fetches single diet plan by ID
- Includes student and mentor details
- Authorization check (only mentor who created it or student it's for)
- Returns 404 if not found, 403 if unauthorized

#### `GET /api/diet-plans/[id]/download`
**File**: `src/app/api/diet-plans/[id]/download/route.ts`

- Converts TipTap JSON to HTML
- Generates styled HTML document
- Auto-triggers print dialog (acts as PDF download)
- Supports:
  - Headings (h1-h6)
  - Lists (bullet and numbered)
  - Tables with borders
  - Images
  - Text formatting (bold, italic)

**TipTap JSON to HTML Conversion**:
```typescript
function tiptapJsonToHtml(content: any): string {
  // Recursively processes TipTap JSON nodes
  // Handles: text, headings, lists, tables, images
  // Applies marks: bold, italic, code
}
```

### 4. Styling Enhancements

**HTML Export Template**:
- Professional header with gradient background
- Metadata section (mentor, student, date, tags)
- Readable typography (Arial, line-height 1.6)
- Styled tables (purple headers, zebra striping)
- Print-optimized CSS
- Footer with generation date

## User Flow

### For Mentors:
1. Go to "Diet Plans" section
2. View list of created diet plans
3. Click "View" button → Opens detail page in new tab
4. Click "Download PDF" → Prints/saves as PDF
5. Click "Back" → Returns to dashboard

### For Students:
1. Go to "Diet Plans" section (requires FLOURISH subscription)
2. View grid of diet plans created for them
3. Click "View Diet Plan" → Opens detail page in new tab
4. Click "Download PDF" → Prints/saves as PDF
5. Click "Back" → Returns to dashboard

## Technical Details

### Authorization
- Detail page checks if user is mentor (creator) OR student (recipient)
- Returns 403 Forbidden if unauthorized
- Ensures privacy and data security

### PDF Generation
Uses browser's native print functionality:
1. Endpoint returns styled HTML
2. Auto-triggers `window.print()` on load
3. User can "Save as PDF" from print dialog
4. Works on all modern browsers
5. No external PDF libraries needed

### Navigation
- Uses `window.open(..., '_blank')` for new tab
- Preserves dashboard state
- Clean URLs: `/dashboard/diet-plan/[id]`
- Back button uses `router.back()`

## Benefits

### User Experience
✅ No more scrolling through long content in dashboard
✅ Clean, focused view of diet plan
✅ Easy to share (copy URL)
✅ Professional PDF export
✅ Fast loading (separate page)

### Design
✅ Card-based layout is modern and intuitive
✅ Responsive grid (1 col mobile, 2-3 cols desktop)
✅ Consistent styling with rest of app
✅ Better information hierarchy

### Performance
✅ Lazy loading (only fetch when needed)
✅ Separate route = smaller bundle on dashboard
✅ HTML-to-PDF is lightweight (no heavy libraries)

## Files Modified

1. `src/components/dashboard/mentor/sections/diet-plans-section.tsx`
   - Added "View" button to each plan card
   - Opens in new tab

2. `src/components/dashboard/user/sections/diet-plans-section.tsx`
   - Replaced inline viewer with card grid
   - Added "View Diet Plan" buttons
   - Removed unused state and imports

## Files Created

1. `src/app/dashboard/diet-plan/[id]/page.tsx`
   - Diet plan detail page component
   - Shows full plan with download option

2. `src/app/api/diet-plans/[id]/route.ts`
   - GET endpoint for single diet plan
   - Authorization checks

3. `src/app/api/diet-plans/[id]/download/route.ts`
   - GET endpoint for PDF download
   - TipTap JSON to HTML conversion
   - Styled HTML export

## Testing Steps

### Test View Functionality
1. Log in as DIETPLANNER mentor
2. Create a diet plan for a FLOURISH student
3. Click "View" button
4. Verify opens in new tab
5. Verify all content displays correctly

### Test Download Functionality
1. On diet plan detail page
2. Click "Download PDF"
3. Verify print dialog opens
4. Save as PDF
5. Verify PDF contains:
   - Header with gradient
   - All content (lists, tables, images)
   - Proper formatting
   - Footer with date

### Test Student Access
1. Log in as FLOURISH student
2. Go to Diet Plans section
3. Verify see all plans created for them
4. Click "View Diet Plan"
5. Click "Download PDF"

### Test Authorization
1. Try accessing another student's diet plan
2. Should see 403 error or redirect
3. Non-FLOURISH students should see upgrade message

## Future Enhancements

### Potential Additions:
- [ ] Email diet plan directly to student
- [ ] Edit existing diet plans
- [ ] Version history
- [ ] Diet plan templates
- [ ] Progress tracking integration
- [ ] Calorie calculator
- [ ] Recipe suggestions
- [ ] Meal prep images upload
- [ ] Custom PDF styling options
- [ ] Export to Google Docs/Word

### PDF Improvements:
- [ ] Use dedicated PDF library (jsPDF, pdfmake)
- [ ] Custom page margins
- [ ] Page numbers
- [ ] Table of contents
- [ ] Watermark option
- [ ] Multiple export formats (Word, Markdown)

## Notes

- TipTap JSON conversion handles most common nodes
- Images embedded as base64 work in PDF
- Print dialog is browser-native (varies by browser)
- HTML export ensures compatibility across platforms
- No server-side PDF generation needed (reduces costs)
