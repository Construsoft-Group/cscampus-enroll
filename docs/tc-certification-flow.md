# TC Certification — Customer Enrollment Flow

This flow handles registrations for the course **"Certificación Trimble Connect"** (course ID 249). It follows the same synchronous pattern as BIMTC and ISO — enrollment is completed in a single request at form submission time.

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

## Enrollment Flow (`POST /tc-certification/customer-enroll`)

```
User submits form
       │
       ▼
Check customer_enrollment_request
WHERE course_id = 249 AND email = ?
       │
   ┌───┴───┐
Duplicate  New
   │        │
   ▼        ▼
Render     Insert into customer_enrollment_request
form_      │
response_  ├─ Send internal admin email
redirect   │    ("Formulario TC Certification")
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
       Enroll in course 249 (30 days)
       [Group assignment skipped — GROUP_ID = 0]
       Insert into all_enrollments
       Send enrollment confirmation email
                 │
                 ▼
       Render form_response_redirect
       ("¡Gracias por registrarte!")
       → redirect to campus course page
```

## Course Configuration

| Parameter | Value |
|-----------|-------|
| Course ID | `249` |
| Group ID | `0` (not configured — group step is skipped) |
| Course name | `Certificación Trimble Connect` |
| Enrollment duration | 30 days |
| Course link | `https://campus.construsoft.com/user/index.php?id=249` |

## Duplicate Logic

- A request is considered a duplicate if the same **email** already exists in `customer_enrollment_request` for **course ID 249**.
- There is no time-based window — any prior registration permanently blocks a new one.
- The duplicate response is a redirect page with a link to the campus, not an error.

## Database Writes

**`customer_enrollment_request`** (always, on new submission):

| Column | Value |
|--------|-------|
| `course_Id` | `249` |
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
| `course_id` | `249` |
| `user_email` | From form |
| `role` | `"Estudiante"` |
| `course_group` | `0` |

## Email Notifications

| Email | Recipient | Trigger |
|-------|-----------|---------|
| Internal admin notification | Admin | Every new submission |
| Enrollment confirmation | User | After successful enrollment |

Template used: `gen_mail_enrolled.ejs`

## Notes

- **Group assignment is not active**: `GROUP_ID` is set to `0` in the service. The `addUserToMoodleGroup` call is guarded by `if (GROUP_ID > 0)` and is therefore skipped until a real group ID is configured.
- The course link uses `/user/index.php?id=249` instead of the standard `/course/view.php?id=249` used by BIMTC and ISO — this may be intentional (participant list view) or a configuration oversight.
- The form shares the same template structure, CSS (`stylescsBimtc.css`), and JS (`formcs.js`) as BIMTC and ISO.
