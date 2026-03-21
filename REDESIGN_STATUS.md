# BILLMUN Portal Redesign Status

## User Requirements Summary

### 1. Conference Details Update
- **OLD:** Bilkent University, Ankara, Turkey
- **NEW:** Rowad Al Khaleej International Schools Khobar, Saudi Arabia
- **Dates:** March 27-28, 2026

### 2. Font Changes
- **OLD:** Playfair Display (headings), Inter (body)
- **NEW:** Jotia W00 Regular, Jotia W00 Bold
- **Status:** Font links added to layout, Tailwind config updated

### 3. Branding
- Replace all "BILLMUN", "BM" text with billmun.png logo
- **Issue:** Logo file not found in project - needs to be provided

### 4. Remove Emojis
- Replace all emoji usage with proper icon components
- Found: Location emoji on home page

### 5. Registration Form Enhancements
- Add committee dropdown
- Add allocated country dropdown

### 6. Home Page Extension
- Add more details and information
- Make it less bland, more engaging
- Reference: anthropic.com design

### 7. Legal Documents (Extensive, 300+ lines each)
- Privacy Policy - IN PROGRESS
- Terms of Service - TODO
- Acceptable Use Policy - TODO

### 8. Footer
- Add footer component with legal links
- Add contact information
- Add company info

## Completed
- ✅ Jotia W00 fonts added to layout
- ✅ Tailwind config updated for Jotia fonts
- ✅ Privacy Policy created (extensive, comprehensive)
- ✅ Dev server restarted (running on port 3001)

## In Progress
- 🔄 Updating all font references from Playfair/Inter to Jotia
- 🔄 Removing emojis

## TODO
- ⏳ Update conference location everywhere
- ⏳ Create Terms of Service page
- ⏳ Create Acceptable Use Policy page
- ⏳ Add committee/country dropdowns to registration
- ⏳ Extend home page with more content
- ⏳ Create footer component
- ⏳ Replace text branding with logo (waiting for logo file)
- ⏳ Global font replacement in all components

## Notes
- Logo file (billmun.png) not found - user needs to provide this
- Need to update database schema to include committee and country fields for registration
- All legal documents should be extensive (300+ lines) and protect all parties
