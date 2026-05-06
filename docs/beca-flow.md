# Beca (Scholarship) Program — Enrollment Flow

The Beca program handles free course access for students and teachers. It is the only program that uses an **asynchronous, cron-job-driven** enrollment process. Registration and enrollment are separated into two distinct phases.

## Form Fields

| Field | Description |
|-------|-------------|
| `firstname` | User's first name |
| `lastname` | User's last name |
| `institution` | School or institution name |
| `country` | Country of residence |
| `role` | `Estudiante` (Student) or `Profesor` (Teacher) |
| `course` | Selected course name |
| `email` | Contact email (used as unique identifier) |
| `phone` | Contact phone number |

## Phase 1 — Registration (`POST /beca`)

This phase runs synchronously when the user submits the form.

```
User submits form
       │
       ▼
Check for duplicate in beca_request
(email submitted after 2025-01-01)
       │
   ┌───┴───┐
Duplicate  New
   │        │
   ▼        ▼
Send      Insert record into beca_request
duplicate  │
email      ├─ Send reception confirmation email to user
(discount  ├─ Send internal admin notification email
 code)     │
   │       ▼
   └──► Show success message
        ("¡Registro completo!" — 15-day evaluation period)
```

### Duplicate Logic

- A request is considered a duplicate if the same email was already submitted **on or after 2025-01-01**.
- The duplicate notification email includes a **special discount code (97€ — FORMATE25)** as an alternative offer.
- Unlike other programs, the Beca duplicate window is **per calendar year**, not per 24 hours.

### Database Write

On a new submission, a row is inserted into `beca_request`:

| Column | Value |
|--------|-------|
| `firstname` | From form |
| `lastname` | From form |
| `institution` | From form |
| `country` | From form |
| `role` | `Estudiante` or `Profesor` |
| `course` | Selected course name |
| `email` | From form |
| `phone` | From form |
| `submitted_at` | Current timestamp |
| `status` | `""` (empty — pending processing) |

## Phase 2 — Enrollment (Cron Job)

This phase runs automatically via a scheduled job that calls the `enroller` function in `beca.service.js`. It processes all `beca_request` records that have an empty `status` and were submitted more than 24 hours ago.

```
Cron job triggers enroller()
       │
       ▼
Query beca_request WHERE status = ""
AND submitted_at > (2025-01-01) AND < (now - 24h)
       │
       ▼
For each pending record:
       │
       ├─ Sanitize name fields (special char replacement)
       ├─ Generate Moodle username ([fi][la]-[timestamp])
       ├─ Determine group by role:
       │     Estudiante → "PROGRAMA ESTUDIANTES 2025"
       │     Profesor   → "PROGRAMA PROFESORES 2025"
       ├─ Set enrollment dates: now → now + 60 days
       │
       ▼
Query Moodle: does user exist by email?
       │
   ┌───┴───────────┐
  Yes              No
   │               │
   ▼               ▼
Get existing    Create Moodle user
Moodle user ID  Get returned user ID
                Insert into all_users
       │               │
       └───────┬───────┘
               ▼
       Enroll in course (60-day access)
       Add user to group
       Insert into all_enrollments
       Update beca_request.status:
           "enrolled"        (user existed)
           "created + enrolled" (user was new)
       Send enrollment confirmation email
```

### Group Assignment

| Role value | Moodle Group |
|---|---|
| `Estudiante` | `PROGRAMA ESTUDIANTES 2025` |
| `Profesor` | `PROGRAMA PROFESORES 2025` |

### Enrollment Duration

**60 days** from the moment the cron job processes the record.

### Database Writes (Phase 2)

**`all_users`** (only if Moodle user was newly created):

| Column | Value |
|--------|-------|
| `username` | Generated username |
| `firstname` | Sanitized from form |
| `lastname` | Sanitized from form |
| `institution` | From form |
| `country` | From form |
| `role` | From form (`Estudiante` / `Profesor`) |
| `email` | From form |
| `phone` | From form |
| `course` | Selected course name |
| `campus_id` | Moodle user ID |

**`all_enrollments`** (always):

| Column | Value |
|--------|-------|
| `course_id` | Moodle course ID |
| `user_email` | From form |
| `role` | From form |
| `course_group` | Assigned group name |

## Email Notifications

| Email | Recipient | Trigger |
|-------|-----------|---------|
| Reception confirmation | User | Phase 1 — new submission |
| Duplicate notification (with discount) | User | Phase 1 — duplicate detected |
| Internal admin notification | Admin | Phase 1 — new submission |
| Enrollment confirmation | User | Phase 2 — after successful enrollment |

Templates used: `beca_mail_recepcion.ejs`, `beca_mail_enrolled.ejs`

## Notes

- **SharePoint integration** is present in the code but currently **disabled**.
- The 24-hour buffer before cron processing gives the team a window to review submissions before they are automatically enrolled.
- The one-course-per-year policy is enforced solely at the registration phase (Phase 1 duplicate check). If the same person submits under a different email, the system will process them normally.
