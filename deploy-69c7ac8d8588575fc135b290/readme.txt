# Lokesh Portfolio Website Package — Google Sheets Edition

This version reads website content from a published Google Sheet URL.

## Files
- `index.html` — main website
- `style.css` — premium animated styling
- `script.js` — website logic that reads published Google Sheets tabs
- `gsheet-config.js` — put your Google Sheet URL here
- `data/site-data.json` — fallback local content
- `lokesh_website_manager.xlsx` — starter manager workbook you can import into Google Sheets
- `build_from_excel.py` — optional local JSON builder

## Use your own photo
Your image is included as:
- `assets/lokesh-profile.jpg`

If you want a different image, replace that file and update:
- `SEO` sheet → `og_image`

Recommended value after upload:
- `assets/lokesh-profile.jpg`

## How to use with Google Sheets
1. Upload `lokesh_website_manager.xlsx` to Google Drive.
2. Open it with Google Sheets.
3. Keep the same sheet names:
   - Site
   - Theme
   - SEO
   - About
   - Contact
   - Stats
   - Services
   - Projects
   - Process
   - Socials
4. In Google Sheets, click:
   - File → Share → Publish to web
   - Publish the spreadsheet
5. Copy your Google Sheet URL.
6. Open `gsheet-config.js` and paste that URL into `sheetUrl`.
7. Update your Contact sheet with your real Formspree endpoint.
8. Deploy the website.

## What updates automatically from the published Google Sheet
- Name, title, tagline, contact info
- Theme colors
- SEO text
- About section
- Stats
- Services (including add, remove, enable, disable)
- Sample projects
- Workflow steps
- Social links
- Formspree endpoint and redirect URL

## Contact form redirect
The form submits through JavaScript and then redirects back to:
- `index.html#home`

You can change that from the `Contact` sheet.

## Important
- Keep the first header row structure the same in each tab.
- Services, Projects, Process, and Socials use `YES` in the Enabled column to show rows.
- If the Google Sheet URL is blank, the site falls back to `data/site-data.json`.

## Hosting
Works well on:
- Netlify
- GitHub Pages
- Vercel
