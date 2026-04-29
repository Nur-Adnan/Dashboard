# Requirements Document

## Introduction

This feature enables automatic attendance tracking by syncing Google Form responses into the placement dashboard. An admin can create a Google Form directly from the dashboard with a single button click — the app uses the Google Forms API and Google Drive API to programmatically create the form, pre-populate the student name dropdown from the students sheet, and link form responses to the main Google Spreadsheet. The admin then shares the generated form URL with students. Google Form responses are synced into `attendance_logs` automatically via a cron job every 10 minutes, and admins can also trigger a manual sync from the Attendance page UI.

## Glossary

- **Form_Creator**: The server-side module that uses the Google Forms API and Google Drive API to programmatically create a new Google Form for a session.
- **Form_Session**: A named attendance session with a label (e.g. "Orientation") and a date, for which a Google Form is created.
- **Generated_Form_URL**: The shareable `https://docs.google.com/forms/d/{formId}/viewform` URL returned after form creation.
- **Sync_Service**: The server-side module responsible for reading the Form Responses sheet and writing to `attendance_logs`.
- **Form_Responses_Sheet**: The Google Sheet tab that receives Google Form submission data (columns: Timestamp, Student Name, Session Label, Date).
- **Attendance_Logs_Sheet**: The existing `attendance_logs` Google Sheet tab used by the dashboard.
- **Students_Sheet**: The existing `students` Google Sheet tab containing student records with `id` and `name` columns.
- **Name_Matcher**: The sub-component that resolves a submitted student name string to a `student_id` using case-insensitive, whitespace-trimmed fuzzy matching.
- **Sync_API**: The Next.js API route at `POST /api/attendance/sync` that executes a sync run.
- **Create_Form_API**: The Next.js API route at `POST /api/attendance/create-form` that creates a new Google Form for a session.
- **Cron_Job**: The scheduled task (Vercel cron or cron-job.org) that calls the Sync_API on a fixed interval.
- **Sync_Result**: The structured response returned by the Sync_API describing rows processed, records written, records skipped, and errors encountered.
- **Duplicate**: An attendance record where the same `student_id` and `date` combination already exists in `attendance_logs`.

---

## Requirements

### Requirement 1: Read Form Responses

**User Story:** As an admin, I want the app to read Google Form responses from a designated sheet tab, so that attendance submissions are available for processing.

#### Acceptance Criteria

1. WHEN the Sync_API is called, THE Sync_Service SHALL read all rows from the Form_Responses_Sheet using the existing Google Sheets API client.
2. THE Sync_Service SHALL support reading the Form_Responses_Sheet from either the same spreadsheet as the main app (identified by `GOOGLE_SPREADSHEET_ID`) or a separate spreadsheet (identified by `FORM_RESPONSES_SPREADSHEET_ID` env var).
3. WHEN `FORM_RESPONSES_SPREADSHEET_ID` is not set, THE Sync_Service SHALL fall back to reading from `GOOGLE_SPREADSHEET_ID`.
4. THE Sync_Service SHALL expect the Form_Responses_Sheet to have columns in this order: Timestamp, Student Name, Session Label, Date (YYYY-MM-DD).
5. IF the Form_Responses_Sheet cannot be read due to an API error, THEN THE Sync_API SHALL return a 502 response with a descriptive error message.

---

### Requirement 2: Name Fuzzy Matching

**User Story:** As an admin, I want student names submitted via the form to be matched to student records even with minor formatting differences, so that attendance is correctly attributed.

#### Acceptance Criteria

1. WHEN matching a submitted name to a student record, THE Name_Matcher SHALL normalize both the submitted name and each student name by trimming leading and trailing whitespace and converting to lowercase before comparison.
2. WHEN a normalized submitted name exactly matches a normalized student name, THE Name_Matcher SHALL resolve the match to that student's `student_id`.
3. IF no exact normalized match is found, THEN THE Name_Matcher SHALL attempt a contains-match (normalized student name contains the normalized submitted name, or vice versa).
4. IF no match is found after all matching strategies, THEN THE Name_Matcher SHALL record the submitted name as an unmatched entry in the Sync_Result errors list and continue processing remaining rows.
5. IF multiple students match the same submitted name, THEN THE Name_Matcher SHALL record an ambiguous-match error for that row and skip writing a record.

---

### Requirement 3: Duplicate Prevention

**User Story:** As an admin, I want the sync to avoid creating duplicate attendance records, so that the same form submission is not written to the sheet more than once.

#### Acceptance Criteria

1. BEFORE writing a new attendance record, THE Sync_Service SHALL check whether a record with the same `student_id` and `date` already exists in the Attendance_Logs_Sheet.
2. IF a Duplicate is detected, THEN THE Sync_Service SHALL skip writing that record and increment the skipped count in the Sync_Result.
3. THE Sync_Service SHALL NOT overwrite or modify existing attendance records that were created manually through the dashboard UI.
4. THE Sync_Service SHALL build an in-memory index of existing `student_id + date` pairs at the start of each sync run to avoid redundant sheet reads per row.

---

### Requirement 4: Write Attendance Records

**User Story:** As an admin, I want valid, non-duplicate form responses to be written to the attendance logs, so that the dashboard reflects form-submitted attendance.

#### Acceptance Criteria

1. WHEN a form response row is successfully matched and is not a Duplicate, THE Sync_Service SHALL append a new row to the Attendance_Logs_Sheet with columns: `id` (UUID v4), `student_id`, `date`, `present` (always `"true"`), `logged_by` (`"google-form-sync"`), `session_label`.
2. THE Sync_Service SHALL use the `session_label` value from the form response row as the `session_label` column value.
3. THE Sync_Service SHALL use the `date` value from the form response row, which MUST be in `YYYY-MM-DD` format.
4. IF a form response row contains an empty or missing date field, THEN THE Sync_Service SHALL skip that row and record a validation error in the Sync_Result.
5. IF a form response row contains an empty or missing student name field, THEN THE Sync_Service SHALL skip that row and record a validation error in the Sync_Result.

---

### Requirement 5: Partial Sync Failure Handling

**User Story:** As an admin, I want the sync to continue processing all rows even when individual rows fail, so that a single bad entry does not block the rest of the batch.

#### Acceptance Criteria

1. WHEN an error occurs processing an individual form response row, THE Sync_Service SHALL log the error to the server console and continue processing the remaining rows.
2. THE Sync_Service SHALL collect all per-row errors into the Sync_Result errors array, including the row index, submitted name, and error reason.
3. WHEN all rows have been processed, THE Sync_API SHALL return a 200 response containing the Sync_Result regardless of whether individual row errors occurred.
4. IF every row in the sync run fails, THEN THE Sync_API SHALL still return a 200 response with a Sync_Result where `written` is 0 and the errors array is fully populated.
5. THE Sync_Service SHALL NOT use a transaction model; each row write is independent.

---

### Requirement 6: Cron-Triggered Sync

**User Story:** As an admin, I want the sync to run automatically on a schedule, so that attendance data stays up to date without manual intervention.

#### Acceptance Criteria

1. THE Sync_API SHALL expose a `POST /api/attendance/sync` route that accepts requests authenticated with a `Bearer` token matching the `CRON_SECRET` environment variable.
2. IF the `Authorization` header is missing or does not match `Bearer {CRON_SECRET}`, THEN THE Sync_API SHALL return a 401 response.
3. THE Cron_Job SHALL call `POST /api/attendance/sync` with the `Authorization: Bearer {CRON_SECRET}` header at a configurable interval (default: every 10 minutes).
4. THE Sync_API SHALL also accept requests from authenticated admin users (valid JWT with `admin` role) to support manual triggering from the UI.
5. WHERE Vercel deployment is used, THE Cron_Job SHALL be configured in `vercel.json` with a cron schedule expression targeting `/api/attendance/sync`.

---

### Requirement 7: Manual Sync Trigger from UI

**User Story:** As an admin, I want to manually trigger a sync from the Attendance page, so that I can immediately reflect new form submissions without waiting for the next cron run.

#### Acceptance Criteria

1. THE Attendance_Page SHALL display a "Sync from Google Form" button visible only to users with the `admin` role.
2. WHEN the admin clicks "Sync from Google Form", THE Attendance_Page SHALL call `POST /api/attendance/sync` and display a loading state on the button for the duration of the request.
3. WHEN the sync completes successfully, THE Attendance_Page SHALL display a Sonner toast with the message: `"Sync complete — {written} new records added"`.
4. WHEN the sync completes with row-level errors, THE Attendance_Page SHALL display a Sonner warning toast listing the count of errors alongside the success count.
5. IF the sync request fails (non-200 response), THEN THE Attendance_Page SHALL display a Sonner error toast with the server's error message.
6. WHEN the sync completes (success or partial), THE Attendance_Page SHALL invalidate the `attendance-all` TanStack Query cache key to trigger a data refresh.

---

### Requirement 8: Sync Result Response Shape

**User Story:** As an admin, I want the sync API to return a structured result, so that I can understand what was processed, written, skipped, and failed.

#### Acceptance Criteria

1. THE Sync_API SHALL return a JSON response body conforming to the following shape on every 200 response:
   ```
   {
     success: boolean,
     rows_read: number,
     written: number,
     skipped: number,
     errors: Array<{ row: number, name: string, reason: string }>
   }
   ```
2. THE Sync_API SHALL set `success: true` when at least one record was written or when all rows were already duplicates (skipped).
3. THE Sync_API SHALL set `success: false` only when a fatal error prevents any processing (e.g., Form_Responses_Sheet unreadable).
4. THE `rows_read` field SHALL reflect the total number of data rows found in the Form_Responses_Sheet, excluding the header row.

---

### Requirement 9: Environment Configuration

**User Story:** As an admin, I want the sync feature to be configurable via environment variables, so that I can point it at the correct sheet without code changes.

#### Acceptance Criteria

1. THE Sync_Service SHALL read the form responses sheet name from the `FORM_RESPONSES_SHEET_NAME` environment variable, defaulting to `"Form Responses 1"` if not set.
2. THE Sync_Service SHALL read the form responses spreadsheet ID from `FORM_RESPONSES_SPREADSHEET_ID`, falling back to `GOOGLE_SPREADSHEET_ID` if not set.
3. IF `CRON_SECRET` is not set in the environment, THEN THE Sync_API SHALL return a 500 response with the message `"CRON_SECRET not configured"` for any sync request.
4. THE `.env.example` file SHALL be updated to document `FORM_RESPONSES_SPREADSHEET_ID`, `FORM_RESPONSES_SHEET_NAME`, and `CRON_SECRET` with descriptive comments.

---

### Requirement 10: Programmatic Google Form Creation

**User Story:** As an admin, I want to create a Google Form for an attendance session directly from the dashboard with a single button click, so that I don't have to manually build the form in Google Forms.

#### Acceptance Criteria

1. THE Attendance_Page SHALL display a "Create Attendance Form" button visible only to users with the `admin` role.
2. WHEN the admin clicks "Create Attendance Form", THE Attendance_Page SHALL open a dialog with two required fields: Session Label (text input, e.g. "Orientation") and Session Date (date picker).
3. WHEN the admin submits the dialog, THE Attendance_Page SHALL call `POST /api/attendance/create-form` with `{ session_label, date }` and display a loading state for the duration of the request.
4. THE Create_Form_API SHALL use the Google Forms API (`googleapis` `forms` v1) to create a new Google Form with the following structure:
   - Form title: `"Attendance — {session_label} ({date})"`
   - Question 1: "Your Name" — multiple choice (dropdown) with one option per active student name read from the Students_Sheet, sorted alphabetically.
   - Question 2: "Session" — short answer, pre-filled default value set to `session_label`, read-only description.
   - Question 3: "Date" — short answer, pre-filled default value set to `date` in YYYY-MM-DD format.
5. AFTER creating the form, THE Create_Form_API SHALL use the Google Drive API (`googleapis` `drive` v3) to move the form into the same Google Drive folder as the main spreadsheet (if determinable) so the service account retains access.
6. THE Create_Form_API SHALL link the form responses to the main Google Spreadsheet (`GOOGLE_SPREADSHEET_ID`) by creating a response destination using the Forms API `setPublishSettings` or Drive API form linking, so responses appear as a new sheet tab named `"Responses — {session_label}"`.
7. WHEN form creation succeeds, THE Create_Form_API SHALL return `{ form_id, form_url, sheet_name }` where `form_url` is the shareable `https://docs.google.com/forms/d/{formId}/viewform` URL.
8. WHEN form creation succeeds, THE Attendance_Page SHALL display the Generated_Form_URL in the dialog with a "Copy Link" button and a direct "Open Form" link, so the admin can immediately share it with students.
9. WHEN form creation succeeds, THE Attendance_Page SHALL automatically update the `FORM_RESPONSES_SHEET_NAME` used by the Sync_Service to the newly created sheet tab name for that session, stored in component state for the current sync run.
10. IF the Google Forms API or Google Drive API call fails, THEN THE Create_Form_API SHALL return a 502 response with a descriptive error message, and THE Attendance_Page SHALL display a Sonner error toast.
11. THE Create_Form_API SHALL require the requesting user to have the `admin` role (valid JWT).
12. THE service account credentials (`GOOGLE_SERVICE_ACCOUNT_JSON`) SHALL have the following OAuth scopes enabled in Google Cloud Console for this feature to work:
    - `https://www.googleapis.com/auth/forms.body`
    - `https://www.googleapis.com/auth/drive`
    - `https://www.googleapis.com/auth/spreadsheets` (already required)

---

### Requirement 11: Service Account Scope Configuration

**User Story:** As an admin setting up the project, I want clear documentation on the additional Google API scopes required for form creation, so that I can configure the service account correctly.

#### Acceptance Criteria

1. THE `GOOGLE_SHEETS_SETUP.md` documentation file SHALL be updated with a new section explaining how to enable the Google Forms API and Google Drive API in Google Cloud Console.
2. THE documentation SHALL specify the three required OAuth scopes: `spreadsheets`, `forms.body`, and `drive`.
3. THE documentation SHALL note that the existing `GOOGLE_SERVICE_ACCOUNT_JSON` credential is reused — no new credential file is needed, only new scopes must be granted.
4. THE `src/lib/sheets/client.ts` Google Auth initialization SHALL be updated to include `forms.body` and `drive` scopes alongside the existing `spreadsheets` scope.
