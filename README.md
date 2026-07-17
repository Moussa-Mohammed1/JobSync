# JobSync — Automatic Job Application Tracker

> A Chrome Extension (Manifest V3) that automatically records every job application you submit into an Excel spreadsheet. Zero manual interaction required.

---

## Features

- **Auto-detection** — Detects successful job submissions on 10+ major job platforms using DOM observation, URL changes, success modals, and toast notifications
- **Auto-extraction** — Extracts 20+ fields per application: title, company, location, salary, skills, description, recruiter info, and more
- **Excel export** — Saves every application to an `.xlsx` file in your Downloads folder automatically
- **Manual save** — A "Save Current Job" button in the popup for when auto-detection misses one
- **Duplicate prevention** — Skips duplicate applications by URL or Company+Title combination
- **Offline queue** — If the workbook can't be written, applications are queued locally and synced when possible
- **History** — Browse all saved applications with search, reopen job pages
- **Configurable** — Toggle auto-save, notifications, duplicate detection, and auto-export in the settings page

## Supported Websites

| Platform | Domain | Adapter |
|---|---|---|
| LinkedIn | linkedin.com | `adapters/linkedin.js` |
| Indeed | indeed.com | `adapters/indeed.js` |
| Glassdoor | glassdoor.com | `adapters/glassdoor.js` |
| Greenhouse | greenhouse.io | `adapters/greenhouse.js` |
| Lever | lever.co | `adapters/lever.js` |
| Workday | myworkdayjobs.com | `adapters/workday.js` |
| Ashby | ashbyhq.com | `adapters/ashby.js` |
| SmartRecruiters | smartrecruiters.com | `adapters/smartrecruiters.js` |
| Welcome To The Jungle | welcomehunt.com | `adapters/wttj.js` |
| BambooHR | bamboohr.com | `adapters/bamboohr.js` |

## Installation

### Prerequisites

- Chrome 86+ (or any Chromium-based browser)
- PowerShell 7+ (for the setup script)

### Setup

```powershell
# Run the setup script from the project root
.\setup.ps1
```

This downloads the SheetJS library (`.xlsx` reader/writer) and generates extension icons.

### Load into Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Pin JobSync to your toolbar

### First-time configuration

1. Click the JobSync icon → **Settings**
2. Toggle **Auto-export to Downloads** (on by default)
3. _(Optional)_ Click **Import .xlsx File** to load an existing spreadsheet
4. Start applying for jobs — the rest happens automatically

## How It Works

```
User opens job page
       ↓
User clicks Apply
       ↓
User completes application
       ↓
Content script detects success
  (MutationObserver, URL changes, text matching, toasts, modals)
       ↓
Extracts job details
  (adapter-specific selectors, JSON-LD, Open Graph, meta tags)
       ↓
Background service worker saves to storage
       ↓
SheetJS (loaded via importScripts) appends row to in-memory workbook
       ↓
chrome.downloads.download writes .xlsx to ~/Downloads/JobSync/
       ↓
Browser notification: "Application Saved"
```

### Detection Techniques

The `SubmissionDetector` (`utils/detector.js`) uses multiple simultaneous strategies:

| Technique | What it watches |
|---|---|
| MutationObserver | DOM changes for success text ("Application submitted", "Thanks for applying") |
| URL observer | URL changes to known success patterns (`/jobs/apply/success`, `/confirmation`) |
| Polling | Page text scan every 2 seconds for success indicators |
| Visible elements | Checks for visible success headings, modals, alerts |
| Toast notifications | Watches for toast/alert/notification elements appearing |
| Adapter-specific | Each platform can provide custom success selectors and URL patterns |

### Data Extracted

For each application, the extension captures:

`Application Date` · `Company` · `Job Title` · `Location` · `Website` · `Job URL` · `Salary` · `Employment Type` · `Remote Type` · `Recruiter` · `Recruiter Email` · `Posting Date` · `Required Skills` · `Experience Required` · `Application Status` · `Priority` · `Notes` · `Follow-up Date` · `Company Website` · `Description` · `Created At`

## Usage

### Popup

Click the JobSync icon in your toolbar:

- **Current page status** — shows detected company, position, website
- **Save Current Job** — manually save the current page's job info
- **Settings** — opens the full settings page
- **View History** — opens the application history page

### Settings

Open via popup → **Settings** or right-click icon → **Options**.

| Setting | Default | Description |
|---|---|---|
| Auto-save | On | Automatically save on detected submission |
| Auto-export to Downloads | On | Save `.xlsx` to Downloads folder after every application |
| Notifications | On | Show browser notifications when saved |
| Duplicate Detection | On | Skip applications already recorded |
| Debug Mode | Off | Log diagnostic info for troubleshooting |
| Supported Websites | All | Toggle individual platforms on/off |

### File Management

- **Import .xlsx File** — Load an existing spreadsheet to continue from
- **Download .xlsx** — Export the workbook to your Downloads folder at any time
- **Export as JSON** — Backup all data as a JSON file
- **Sync Now** — Process any queued (pending) applications into the workbook

## Project Structure

```
extension/
├── manifest.json              # Chrome Extension Manifest V3
├── background.js              # Service worker — orchestrates saves, XLSX ops, downloads
├── content.js                 # Content script — DOM observation, extraction, messaging
├── offscreen.html / .js       # (Legacy) Offscreen document for File System Access API
├── adapters/                  # Per-platform extraction adapters
│   ├── base.js                # Abstract base adapter class
│   ├── registry.js            # Auto-registration of all adapters
│   ├── linkedin.js            # LinkedIn adapter
│   ├── indeed.js              # Indeed adapter
│   ├── glassdoor.js           # Glassdoor adapter
│   ├── greenhouse.js          # Greenhouse adapter
│   ├── lever.js               # Lever adapter
│   ├── workday.js             # Workday adapter
│   ├── ashby.js               # Ashby adapter
│   ├── smartrecruiters.js     # SmartRecruiters adapter
│   ├── wttj.js                # Welcome To The Jungle adapter
│   └── bamboohr.js            # BambooHR adapter
├── utils/                     # Shared utilities
│   ├── storage.js             # Chrome storage wrapper
│   ├── detector.js            # Success submission detector
│   ├── extractor.js           # Generic data extraction helpers
│   ├── duplicate.js           # Duplicate detection
│   ├── notifications.js       # Notification helpers
│   └── excel.js               # (Legacy) ExcelManager for offscreen operations
├── popup/                     # Browser action popup
│   ├── popup.html / .css / .js
├── options/                   # Settings page
│   ├── options.html / .css / .js
├── history/                   # Application history page
│   ├── history.html / .css / .js
├── lib/
│   └── xlsx.full.min.js       # SheetJS library (downloaded by setup.ps1)
└── assets/
    ├── icon16.png / 48.png / 128.png
```

## Developer Guide

### Adding a New Website

1. Create a new file `adapters/yoursite.js`:

```javascript
class YourSiteAdapter extends JobSiteAdapter {
  constructor() {
    super();
    this.name = 'YourSite';
    this.domains = ['yoursite.com'];
    this.urlPatterns = ['/jobs/', '/apply/'];
  }

  detectJobPage() {
    return window.location.href.includes('/jobs/');
  }

  extractCompany() {
    return Extractor.findInElement('.company-name');
  }

  extractTitle() {
    return Extractor.findInElement('h1');
  }

  extractLocation() {
    return Extractor.findInElement('.location');
  }

  extractSalary() {
    return Extractor.findInElement('.salary-range');
  }

  // Override any other methods from base.js as needed
}

if (typeof window !== 'undefined') {
  window.YourSiteAdapter = YourSiteAdapter;
}
```

2. Add the domain to `manifest.json` in both `host_permissions` and `content_scripts` → `matches`.
3. Add the file to the content_scripts → `js` array in `manifest.json`.
4. The adapter auto-registers via `adapters/registry.js` — no other changes needed.

### Architecture Overview

- **Content Scripts** run on job pages, observe the DOM, extract job info, and send messages to the background.
- **Background Service Worker** coordinates saving, Excel operations, downloads, and notifications.
- **SheetJS (XLSX)** is loaded directly in the service worker via `importScripts('lib/xlsx.full.min.js')` — no offscreen document needed for Excel operations.
- **Data Flow**: Content Script → `chrome.runtime.sendMessage` → Background → `chrome.storage.local` + `chrome.downloads.download`.

### Key APIs Used

| API | Purpose |
|---|---|
| `chrome.storage.local` | Persist settings, saved jobs, workbook data, history |
| `chrome.downloads.download` | Export `.xlsx` to Downloads folder |
| `chrome.notifications` | Show success/error notifications |
| `chrome.alarms` | Periodic sync of pending applications |
| `MutationObserver` | Detect submission success via DOM changes |
| `importScripts` | Load SheetJS library in service worker |
| File System Access API _(optional)_ | Pick/create `.xlsx` files (fallback: file input + download) |

## Troubleshooting

### "Download .xlsx" fails

1. Open `chrome://extensions/`, find JobSync, click the **refresh icon** to reload the service worker.
2. Enable **Debug Mode** in Settings and check the debug panel for error details.
3. The service worker uses `data:` URLs for downloads — ensure the `downloads` permission is granted.

### Applications go to pending but never sync

1. Open Settings → **Sync Now** to manually trigger a sync.
2. Check that **Auto-export to Downloads** is enabled.
3. Open the background console (`chrome://extensions/` → JobSync → **service worker** link) for error messages.

### Nothing is detected on a job page

1. Check the popup — it shows whether a supported website is detected.
2. The website may not be in the supported list. Use **Save Current Job** (manual) as a fallback.
3. Open an issue to request a new adapter.

### Excel file is empty

1. Ensure applications were actually submitted (not just viewed).
2. Try **Download .xlsx** from Settings — if it works, the workbook has data.
3. Check `~/Downloads/JobSync/JobSync_Applications.xlsx` — this is the auto-export path.

### Common errors

| Error | Cause | Fix |
|---|---|---|
| `XLSX_LIBRARY_NOT_LOADED` | SheetJS failed to load | Run `setup.ps1` again |
| `DOWNLOAD_ERROR: ...` | Download API failed | Check Chrome download permissions |
| `URL.createObjectURL is not a function` | Obsolete code | Reload extension (fixed in latest version) |

## License

MIT
