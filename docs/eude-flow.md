# EUDE Program — Enrollment Flow

The EUDE program provides access to the **"Fundamentos Tekla Structures Hormigón EUDE"** course. It is the most straightforward flow in the system: a single fixed course, a single fixed group, and immediate enrollment on form submission with no branching logic.

## Form Fields

| Field | Description |
|-------|-------------|
| `firstname` | User's first name |
| `lastname` | User's last name |
| `company` | Company name (stored as `institution`) |
| `email` | Contact email (unique identifier) |
| `phone` | Phone number |
| `position` | Job position (stored as `role`) |
| `optradio` | Promotional flag (captured, not used in enrollment logic) |

## Flow

```
User submits form (POST /eude)
       │
       ▼
Check 24-hour duplicate in eude_request
(same email within last 24 hours)
       │
   ┌───┴───┐
Duplicate  New
   │        │
   ▼        ▼
Redirect   Insert into eude_request
to         Send internal admin notification email
/eude/      │
not-        ├─ Set course: "Fundamentos Tekla Structures Hormigón EUDE" (fixed)
success     ├─ Set group: 3483 / "PROGRAMA EUDE 2025" (fixed)
            ├─ Set enrollment dates: now → now + 30 days
            ├─ Generate Moodle username ([fi][la]-[timestamp])
            │
            ▼
    Query Moodle: does user exist by email?
            │
       ┌────┴──────────┐
      Yes              No
       │               │
       ▼               ▼
  Get existing    Create Moodle user
  Moodle user ID  Insert into all_users
                      (institution = company,
                       role = position)
       │               │
       └──────┬─────────┘
              ▼
      Enroll in EUDE course (30-day access)
      Add to group 3483 (PROGRAMA EUDE 2025)
      Insert into all_enrollments
      Send enrollment confirmation email
```

## Fixed Course Configuration

The EUDE program always enrolls users in the same course and group — there is no user selection or conditional logic:

| Parameter | Value |
|---|---|
| Course | Fundamentos Tekla Structures Hormigón EUDE |
| Course ID | 240 |
| Group name | PROGRAMA EUDE 2025 |
| Group ID | 3483 |
| Enrollment duration | 30 days |

## Enrollment Duration

**30 days** from the moment of form submission.

## Database Writes

**`eude_request`**:

| Column | Value |
|--------|-------|
| `firstname` | From form |
| `lastname` | From form |
| `company` | From form |
| `email` | From form |
| `phone` | From form |
| `position` | From form |
| `promoValue` | From `optradio` field |
| `submitted_at` | Current timestamp |

**`all_users`** (only if user was new):

| Column | Value |
|--------|-------|
| `username` | Generated username |
| `firstname` | Sanitized |
| `lastname` | Sanitized |
| `email` | From form |
| `phone` | From form (sanitized) |
| `institution` | From `company` field (sanitized) |
| `role` | From `position` field (sanitized) |
| `course` | `"Fundamentos Tekla Structures Hormigón EUDE"` |
| `campus_id` | Moodle user ID |

**`all_enrollments`** (always):

| Column | Value |
|--------|-------|
| `course_id` | 240 |
| `user_email` | From form |
| `role` | From `position` field |
| `course_group` | `"PROGRAMA EUDE 2025"` |

## Email Notifications

| Email | Recipient | Trigger |
|-------|-----------|---------|
| Internal admin notification | Admin | On every new submission |
| Enrollment confirmation | User | After successful Moodle enrollment |

Template used: `gen_mail_enrolled.ejs`

## Notes

- **Simplest flow** in the system — no role selection, no course selection, no category-based routing.
- The `optradio` promotional field is captured in the database but is not used in any enrollment or notification logic.
- **SharePoint integration** is declared in the code but is not used (not even commented-out calls, unlike other programs).
- The `country` field is not collected in the EUDE form and is not stored in `all_users` for EUDE enrollments.
