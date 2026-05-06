# Enrollment Extension — Flow

This flow allows existing students to request a **1-month extension** of their enrollment in a course they are already registered in. It differs from all other enrollment flows: no new Moodle user is created, and the operation acts on an existing enrollment rather than creating one.

There are two separate routes involved:

| Route | Purpose |
|-------|---------|
| `GET /enrollment/extend-form` | Renders the extension request form |
| `POST /enrollment/extend-request` | Processes the submitted form |
| `POST /enrollment/extend` | Internal API endpoint (JSON) — direct extension without form |

---

## Form Fields

| Field | Description |
|-------|-------------|
| `email` | Email of the student registered in Moodle |
| `courseid` | ID of the course to extend (selected from a dynamically loaded list) |
| `reason` | Student's written justification for the extension |
| `privacy` | Privacy policy acceptance (required checkbox) |
| `commitment` | Commitment to complete the course (required checkbox) |
| `newsletter` | Marketing consent (optional checkbox) |

The course list in the form is populated dynamically by `/js/formExtension.js` on the client side.

---

## Extension Flow (`POST /enrollment/extend-request`)

```
User submits form
       │
       ▼
Validate required fields (email, courseid, reason)
       │
  Missing → 400 "Faltan datos"
       │
       ▼
Parse courseid as integer
       │
  Invalid → 400 "Curso inválido"
       │
       ▼
Query Moodle by email (queryMoodleUser)
       │
  API error → 503 "Error temporal"
  Not found → 404 "Usuario no encontrado"
       │
       ▼
Check if user is enrolled in the course
(active OR suspended status)
       │
  Not enrolled → 404 "Usuario no matriculado en el curso"
       │
       ▼
Get user's groups in that course
       │
  Group name = "fundae" → 403 "Extensión no permitida"
       │
       ▼
Count prior extensions for this user + course
(getExtensionCount from enrollment_extension table)
       │
       ▼
Decide action (decideExtensionAction)
       │
  action = "BLOCK" → 409 "Límite de extensiones excedido"
       │
       ▼
Extend enrollment in Moodle by 1 month
(extendEnrollmentByUser → extendEnrollment API call)
       │
  Moodle error → 500 "Error al extender la matrícula"
       │
       ▼
Insert into enrollment_extension table
       │
  DB error → 500 + log to logs/enrollment_fallback.log
       │
       ▼
Send extension confirmation email to student
(sendExtensionAppliedNotification — non-blocking)
       │
       ▼
Render form_response
("¡Extensión aplicada!")
→ link to campus login
```

---

## Internal API Flow (`POST /enrollment/extend`)

This endpoint is separate from the form and is called with a JSON body. It performs a direct extension without any of the form-level validations (duplicate check, group rules, extension count).

```
POST /enrollment/extend
Body: { userid, courseid, months, reason }
       │
       ▼
Validate required fields
       │
  Missing → 400 JSON error
       │
       ▼
extendEnrollmentByUser({ userid, courseid, months, reason })
       │
  Moodle exception → 500 JSON error
  DB error → 500 JSON error (also logs to fallback file)
       │
       ▼
200 JSON { success: true, result }
```

---

## Business Rules

### Ineligible Groups

Users belonging to a group named **`fundae`** (case-insensitive) in the requested course are blocked from receiving an extension. The response tells them to contact `soporte.tekla@construsoft.com`.

### Extension Limit

The helper `decideExtensionAction(currentCount)` reads the number of prior extensions from the `enrollment_extension` table and returns either `"ALLOW"` or `"BLOCK"`. When blocked, the user receives a 409 response and cannot submit a new request.

### Extension Duration

All extensions via the form are **fixed at 1 month**. The internal API (`POST /enrollment/extend`) accepts a `months` parameter for flexibility.

---

## Database Writes

**`enrollment_extension`** (on successful extension):

| Column | Value |
|--------|-------|
| `user_id` | Moodle user ID (looked up by email) |
| `course_id` | From form |
| `extended_by` | `1` (months, always 1 for form submissions) |
| `created_at` | Current timestamp |
| `reason` | From form |
| `promo_value` | `newsletter` checkbox value (`on` / `off`) |

If the DB write fails, the error is appended to `logs/enrollment_fallback.log` and a 500 is returned.

---

## Email Notifications

| Email | Recipient | Trigger |
|-------|-----------|---------|
| Extension confirmation | Student | After successful Moodle extension |

The email is sent via `sendExtensionAppliedNotification` and includes the student's name, the course name (fetched from Moodle by ID), and the number of months extended. This call is **non-blocking** — a failure is logged but does not affect the response sent to the user.

---

## Notes

- Unlike all other flows, this one **never creates a Moodle user** — it only acts on existing enrollments.
- The course selector in the form is populated by client-side JavaScript (`/js/formExtension.js`), not rendered server-side.
- The form uses `form_response.ejs` (not `form_response_redirect.ejs`) for both success and error states.
- If Moodle is temporarily unavailable during the `queryMoodleUser`, `isUserInCourseAnyStatus`, or `getUserGroupNamesInCourse` calls, the user receives a 503 with an option to retry, rather than a hard failure.
