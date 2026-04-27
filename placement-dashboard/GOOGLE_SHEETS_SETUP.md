# Google Sheets Setup Guide

This guide walks you through setting up Google Sheets as the database for the Placement Dashboard.

---

## Step 1: Create a New Google Spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click the **+ New** button (green, top-left)
3. A new blank spreadsheet opens in a new tab

---

## Step 2: Name the Spreadsheet

1. Click on the default name "Untitled spreadsheet" at the top-left
2. Rename it to: `Placement Dashboard DB`
3. Press Enter to save

---

## Step 3: Create the 5 Sheets (Tabs)

1. In your new spreadsheet, look at the bottom-left corner
2. You should see one tab called "Sheet1"
3. **Right-click** on "Sheet1" → Rename
4. Create these 5 sheets with exact names (case-sensitive):

| Sheet Name | Purpose |
|------------|---------|
| `students` | Student records |
| `attendance_logs` | Daily attendance |
| `progress_logs` | Student progress notes |
| `team_updates` | Daily team updates |
| `users` | User accounts (admins, mentors) |

To add new sheets:
- Click the **+** button next to the existing tabs
- Or right-click existing tab → Insert → New sheet
- Then rename each sheet

---

## Step 4: Add Header Rows

Open each sheet and add this exact first row:

### students
```
id | name | batch | mentor_email | stage | risk_status | risk_reasons | last_activity_date | created_at | updated_at
```

### attendance_logs
```
id | student_id | date | present | logged_by
```

### progress_logs
```
id | student_id | note | logged_at | logged_by
```

### team_updates
```
id | submitted_by | role | date | goals | achievements | blockers | submitted_at
```

### users
```
id | name | email | role | active | password_hash
```

**Important:** Use exact column names (case-sensitive). These are the headers the API expects.

---

## Step 5: Set Up Google Cloud Project

### 5.1 Create Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown (top-left, near "Google Cloud")
3. Click **New Project** (orange button, top-right)
4. Name: `Placement Dashboard`
5. Click **Create**
6. Wait for project to be created, then select it

### 5.2 Enable Google Sheets API

1. In your new project, go to **APIs & Services** → **Library** (left sidebar)
2. Search for "Google Sheets API"
3. Click on "Google Sheets API"
4. Click **Enable**

### 5.3 Create Service Account

1. Go to **APIs & Services** → **Credentials** (left sidebar)
2. Click **+ CREATE CREDENTIALS** (top)
3. Select **Service Account**
4. Name: `Placement Dashboard Service`
5. Description: `Service account for Placement Dashboard app`
6. Click **Create and Continue**
7. Skip Role selection (click Continue)
8. Skip Grant users access (click Done)

### 5.4 Generate JSON Key

1. On the Credentials page, find your new service account in the list
2. Click on it (the email address)
3. Go to **Keys** tab
4. Click **Add Key** → **Create new key**
5. Select **JSON**
6. Click **Create**
7. A JSON file downloads to your computer

---

## Step 6: Configure Environment Variables

### 6.1 Get Spreadsheet ID

1. Open your Google Sheet
2. Look at the URL in your browser:
   ```
   https://docs.google.com/spreadsheets/d/1abc123DEF456ghi789JKL012mno345PQR/edit
   ```
3. Copy the ID between `/d/` and `/edit`:
   ```
   1abc123DEF456ghi789JKL012mno345PQR
   ```

### 6.2 Prepare Service Account JSON

1. Open the downloaded JSON file in a text editor (VS Code, Notepad, etc.)
2. Copy the entire contents
3. Go to your browser console (F12 → Console tab)
4. Type: `JSON.stringify(YOUR_JSON_HERE)`
   - Paste your JSON inside the parentheses
5. Copy the minified result (single line, no line breaks)

### 6.3 Update .env.local

Edit your `.env.local` file:

```bash
# Google Sheets (REQUIRED)
GOOGLE_SERVICE_ACCOUNT_JSON='{...paste minified JSON here...}'
GOOGLE_SPREADSHEET_ID='1abc123DEF456ghi789JKL012mno345PQR'

# Auth Secrets (generate random 32+ char strings)
JWT_ACCESS_SECRET=your_random_access_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_random_refresh_secret_here_min_32_chars
CRON_SECRET=your_cron_secret_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend (optional - for email alerts)
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

---

## Step 7: Share Spreadsheet with Service Account

1. Open your Google Sheet "Placement Dashboard DB"
2. Click the **Share** button (top-right, blue)
3. In "Add people and groups", paste the service account email from your JSON file:
   ```
   (look for "client_email" in your JSON, e.g:)
   placement-dashboard@placement-dashboard.iam.gserviceaccount.com
   ```
4. Set to **Editor** (not Viewer)
5. Click **Send**

---

## Step 8: Run Setup Script

```bash
cd placement-dashboard
npm run setup-sheets
```

This script will:
- Verify the sheets exist
- Add header rows to each sheet
- Create a default admin user

**Expected output:**
```
✓ Sheet "students" exists
✓ Sheet "attendance_logs" exists
...
✓ Headers added to "students"
✓ Default admin user created
  Email: admin@example.com
  Password: admin123

⚠️  IMPORTANT: Change the admin password after first login!
```

---

## Step 9: Test the Connection

### Start the dev server:
```bash
npm run dev
```

### Test GET /api/students:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

This should return:
```json
{
  "user": {...},
  "accessToken": "eyJ..."
}
```

Copy the `accessToken` and test the students endpoint:

```bash
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response (empty initially):
```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "pages": 0
}
```

---

## Troubleshooting

### "API_NOT_ENABLED" Error
- Go to Google Cloud Console → APIs & Services → Library
- Search and enable "Google Sheets API"

### "The spreadsheet cannot be found"
- Check your `GOOGLE_SPREADSHEET_ID` is correct in `.env.local`
- Verify the spreadsheet exists and you have access

### "Permission denied" when writing
- Make sure you shared the spreadsheet with the service account email
- Ensure the service account has "Editor" access, not "Viewer"

### "JWT token error"
- Verify `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
- They must be 32+ characters each

---

## Quick Reference

| Item | Where to Find |
|------|---------------|
| Spreadsheet ID | URL: `/d/SPREADSHEET_ID/edit` |
| Service Account Email | JSON: `client_email` |
| Private Key | JSON: `private_key` |
| Sheet Tab Names | students, attendance_logs, progress_logs, team_updates, users |

---

Your Google Sheets database is now ready! 🎉

Run `npm run dev` and open http://localhost:3000 to see the dashboard.