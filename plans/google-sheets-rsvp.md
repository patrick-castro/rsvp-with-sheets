# Google Sheets RSVP System

## Overview

This document describes how the RSVP system connects to Google Sheets. The React app has no traditional backend. Instead, a **Google Apps Script Web App** acts as a serverless API that reads and writes directly to a Google Spreadsheet.

```
Browser (React)  ──HTTPS──►  Apps Script Web App  ──►  Google Spreadsheet
                              (search, rsvp, list)        (Guests sheet)
```

---

## RSVP Flow

1. Guest visits the app and types their name
2. The app calls the Apps Script `/search` endpoint
3. Apps Script fuzzy-matches the name against the Guests sheet
   - Matching is **token-based**: `"Patrick Castro"` matches `"Patrick Antonio Castro"` because all user-provided tokens appear in the stored name
   - Single-letter tokens (middle initials like "N.") are ignored
4. **Found**: Guest sees their name and chooses Confirm or Decline, with an optional note
5. **Not found**: Guest sees an error and contact info to follow up
6. On submit, the app calls the Apps Script `/rsvp` endpoint to update the row

---

## Google Sheets Structure

Sheet name: **Guests**

| Column | Header | Notes |
|--------|--------|-------|
| A | ID | Auto-assigned row number |
| B | Name | Full name as it appears on the invite |
| C | Status | `pending` / `confirmed` / `declined` |
| D | Notes | Optional message from the guest |
| E | Created At | ISO timestamp, set on row creation |
| F | Updated At | ISO timestamp, updated on each RSVP |

Pre-populate column B with your invite list before the event. Status defaults to `pending`.

---

## One-Time Setup

### 1. Create the Google Spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Rename it to something like **"RSVP - [Your Event Name]"**
3. Rename **Sheet1** to **Guests**
4. Add these headers in row 1 (one per column A–F):
   ```
   ID    Name    Status    Notes    Created At    Updated At
   ```
5. Fill in your guest names in column B starting from row 2
   - Leave Status, Notes, Created At, Updated At blank — Apps Script will fill them in

### 2. Create the Apps Script

1. In your spreadsheet, click **Extensions → Apps Script**
2. Delete any existing code in `Code.gs`
3. Paste the full script from the section below
4. Save the project (Ctrl/Cmd + S)

### 3. Deploy as a Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Type" and select **Web app**
3. Set:
   - **Description**: RSVP API
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Authorize the app when prompted (it needs access to your spreadsheet)
6. Copy the **Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### 4. Configure the React App

Create a `.env.local` file in the project root (this file is gitignored):

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Replace the URL with the one you copied in step 3.

### 5. Re-deploy after script changes

If you ever update `Code.gs`, you must create a **new deployment** for the changes to take effect. Editing and saving the script alone does not update the live endpoint.

---

## Apps Script Code (`Code.gs`)

Paste this entire block into your Apps Script editor:

```javascript
const SHEET_NAME = "Guests";

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const params = e.parameter || {};
  const body = e.postData ? JSON.parse(e.postData.contents || "{}") : {};
  const action = params.action || body.action;

  try {
    let result;
    if      (action === "search")       result = searchGuest(params.name || body.name);
    else if (action === "rsvp")         result = submitRsvp(body);
    else if (action === "list")         result = listGuests();
    else if (action === "addGuest")     result = addGuest(body.name);
    else if (action === "updateStatus") result = submitRsvp(body);
    else result = { error: "Unknown action" };

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- Name matching ---

function tokenize(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")   // strip punctuation
    .split(/\s+/)
    .filter(t => t.length > 1); // drop single-letter initials (e.g. "N")
}

function namesMatch(stored, query) {
  const storedTokens = tokenize(stored);
  const queryTokens  = tokenize(query);
  // Every token the user typed must appear somewhere in the stored name
  return queryTokens.every(t => storedTokens.includes(t));
}

// --- Actions ---

function searchGuest(name) {
  if (!name) return { found: false };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data  = sheet.getDataRange().getValues();
  const matches = [];

  for (let i = 1; i < data.length; i++) {
    if (namesMatch(String(data[i][1]), name)) {
      matches.push({
        id:     String(data[i][0]),
        name:   data[i][1],
        status: data[i][2] || "pending",
      });
    }
  }

  return matches.length > 0 ? { found: true, guests: matches } : { found: false };
}

function submitRsvp({ id, status, note }) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.getRange(i + 1, 3).setValue(status);
      sheet.getRange(i + 1, 4).setValue(note || "");
      sheet.getRange(i + 1, 6).setValue(new Date().toISOString());
      return { success: true };
    }
  }

  return { error: "Guest not found" };
}

function listGuests() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const [, ...rows] = sheet.getDataRange().getValues();

  return rows.map(r => ({
    id:        String(r[0]),
    name:      r[1],
    status:    r[2] || "pending",
    notes:     r[3],
    createdAt: r[4],
    updatedAt: r[5],
  }));
}

function addGuest(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const id    = String(sheet.getLastRow()); // use row number as stable ID
  const now   = new Date().toISOString();

  sheet.appendRow([id, name, "pending", "", now, now]);
  return { success: true, id };
}
```

---

## Architecture Notes

### Why Apps Script, not a Node backend?

- Zero infrastructure cost — runs entirely inside Google's platform
- No deployment pipeline or server to maintain
- Credentials stay server-side; guests never see the full invite list
- One-click deploy from the same Google account that owns the spreadsheet

### Why token-based name matching?

Guests often remember their names differently from how they appear on the invite (middle names, initials, hyphenation). Token matching handles the most common variations without requiring a full fuzzy-search library:

| Stored name | Query | Match? |
|---|---|---|
| Patrick Antonio Castro | Patrick Castro | ✅ |
| Patrick Antonio Castro | Patrick Antonio N. Castro | ✅ (N. filtered as single char) |
| Patrick Antonio Castro | Pat Castro | ❌ (abbreviations not supported) |
| Maria Santos-Reyes | Maria Reyes | ❌ (hyphenated tokens are treated as one) |

For edge cases (abbreviations, typos), guests should use the contact info on the Not Found page.

### Multiple matches

If two guests share tokens (e.g., two people named "Juan Santos"), the Found page lists all matches and asks the guest to confirm which one they are before proceeding.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_APPS_SCRIPT_URL` | Yes | Full URL of the deployed Apps Script web app |

Never commit `.env.local`. The `.env.example` file in the repo root shows the expected format.
