# ISO 19650 — Customer Enrollment Flow

This flow handles free course registrations for the course **"Cómo cumplir la norma ISO 19650 con Trimble Connect"** (course ID 259). It is structurally identical to the BIMTC flow — synchronous enrollment in a single request, fixed course and group IDs.

## Form Fields

| Field | Description |
|-------|-------------|
| `firstname` | User's first name |
| `lastname` | User's last name |
| `company` | Company name |
| `activity` | Company sector / activity type |
| `email` | Corporate email (used as unique identifier) |
| `emailConfirm` | Email confirmation (client-side only, not sent to server) |
| `phone` | Contact phone number |
| `position` | Job position / role |
| `optradio` | Privacy policy acceptance (`on` / absent) |
| `promo` | Marketing consent (`on` / absent) |

## Enrollment Flow (`POST /iso/customer-enroll`)

```
User submits form
       │
       ▼
Check customer_enrollment_request
WHERE course_id = 259 AND email = ?
       │
   ┌───┴───┐
Duplicate  New
   │        │
   ▼        ▼
Render     Insert into customer_enrollment_request
form_      │
response_  ├─ Send internal admin email
redirect   │    ("Formulario ISO 19650 | Trimble Connect")
("Ya       │
habías     ▼
solicitado Query Moodle by email
acceso")   │
       ┌───┴──────────────┐
    Exists             Not found
       │                   │
       ▼                   ▼
Get existing        Create Moodle user
Moodle user ID      Get returned user ID
                    Insert into all_users
       │                   │
       └─────────┬─────────┘
                 ▼
       Enroll in course 259 (30 days)
       Add user to group 3987
       Insert into all_enrollments
       Send enrollment confirmation email
                 │
                 ▼
       Render form_response_redirect
       ("¡Gracias por registrarte!")
       → redirect to construsoft.es thank-you page
```

## Course Configuration

| Parameter | Value |
|-----------|-------|
| Course ID | `259` |
| Group ID | `3987` (FULL25) |
| Course name | `Cómo cumplir la norma ISO 19650 con Trimble Connect` |
| Enrollment duration | 30 days |
| Course link | `https://campus.construsoft.com/course/view.php?id=259` |

## Duplicate Logic

- A request is considered a duplicate if the same **email** already exists in `customer_enrollment_request` for **course ID 259**.
- There is no time-based window — any prior registration permanently blocks a new one.
- The duplicate response is a redirect page with a link to the campus, not an error.

## Database Writes

**`customer_enrollment_request`** (always, on new submission):

| Column | Value |
|--------|-------|
| `course_Id` | `259` |
| `firstname` | From form |
| `lastname` | From form |
| `company` | From form |
| `activity` | From form |
| `email` | From form |
| `phone` | From form |
| `position` | From form |
| `promoValue` | `on` or `off` |

**`all_users`** (only if Moodle user was newly created):

| Column | Value |
|--------|-------|
| `username` | Generated (`[fi][la]-[timestamp]`) |
| `firstname` | Sanitized |
| `lastname` | Sanitized |
| `institution` | Company name |
| `country` | `"Company"` |
| `role` | `"Estudiante"` |
| `email` | From form |
| `phone` | From form |
| `course` | Course name |
| `campus_id` | Moodle user ID |

**`all_enrollments`** (always):

| Column | Value |
|--------|-------|
| `course_id` | `259` |
| `user_email` | From form |
| `role` | `"Estudiante"` |
| `course_group` | `3987` |

## Email Notifications

| Email | Recipient | Trigger |
|-------|-----------|---------|
| Internal admin notification | Admin | Every new submission |
| Enrollment confirmation | User | After successful enrollment |

Template used: `gen_mail_enrolled.ejs`

## Notes

- The form shares the same template structure, CSS (`stylescsBimtc.css`), and JS (`formcs.js`) as BIMTC and TC-Certification.
- The `emailConfirm` field is validated client-side only and is not forwarded to the server.
- Group `3987` (FULL25) is fixed — there is no dynamic group selection.
