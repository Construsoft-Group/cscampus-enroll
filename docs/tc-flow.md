# Trimble Connect (TC) Program — Enrollment Flow

The TC program provides access to the **"Common Data Environment con Trimble Connect"** course. It processes enrollments **immediately** on form submission. The key differentiator from other programs is that the Moodle group assignment depends on the user's company category.

## Form Fields

| Field | Description |
|-------|-------------|
| `firstname` | User's first name |
| `lastname` | User's last name |
| `email` | Contact email (unique identifier) |
| `country` | Country of residence |
| `phone` | Phone number |
| `company` | Company name (stored as `institution`) |
| `company_category` | Company type — determines Moodle group |
| `company_activity` | Company activity / sector |
| `position` | Job position (stored as `role`) |
| `optradio` | Promotional flag (captured, not used in enrollment logic) |

## Flow

```
User submits form (POST /tc)
       │
       ▼
Check 24-hour duplicate in tc_request
(same email within last 24 hours)
       │
   ┌───┴───┐
Duplicate  New
   │        │
   ▼        ▼
Redirect   Insert into tc_request
to         Send internal admin notification email
/tc/not-   │
success    Determine group by company_category:
            "Administración / Institución pública" → "23_ADM"
            "Promotor / Dueño de proyecto"         → "23_OWN"
            "Constructora / Ingenieria"             → "23_CON"
            "Otro"                                 → "23_CON"
            │
            ├─ Set course: "Common Data Environment con Trimble Connect" (fixed)
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
                       role = position,
                       country = from form)
       │               │
       └──────┬─────────┘
              ▼
      Enroll in TC course (30-day access)
      Add to category-based group (23_ADM / 23_OWN / 23_CON)
      Insert into all_enrollments
      Send enrollment confirmation email
```

## Group Assignment by Company Category

| `company_category` value | Moodle Group |
|---|---|
| `Administración / Institución pública` | `23_ADM` |
| `Promotor / Dueño de proyecto` | `23_OWN` |
| `Constructora / Ingenieria` | `23_CON` |
| `Otro` | `23_CON` |

> The `23_FULL` group is referenced in the course configuration but is not directly assigned in the TC flow — it is only used by the CS Hotmart and CS Customer flows for the Trimble Connect course.

## Fixed Course Configuration

The TC program always enrolls users in the same course and does not allow the user to select a different one:

| Parameter | Value |
|---|---|
| Course | Common Data Environment con Trimble Connect |
| Course ID | 174 |
| Enrollment duration | 30 days |

## Enrollment Duration

**30 days** from the moment of form submission.

## Country-Based Owner Mapping (CRM Tracking)

The TC service includes logic to determine a CRM owner field based on the user's country. This is intended for SharePoint/CRM list item creation, which is currently disabled. The mapping is:

| Country | Owner |
|---------|-------|
| Argentina, Bolivia, Chile, Colombia, Ecuador, Paraguay, Uruguay, Venezuela | `LATAM - Trimble Connect leads` |
| España | `ES - General Leads` |
| All others | `ES - Marketing` |

## Database Writes

**`tc_request`**:

| Column | Value |
|--------|-------|
| `firstname` | From form |
| `lastname` | From form |
| `email` | From form |
| `country` | From form |
| `phone` | From form |
| `company` | From form |
| `company_category` | From form |
| `company_activity` | From form |
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
| `country` | From form (sanitized) |
| `phone` | From form (sanitized) |
| `institution` | From `company` field (sanitized) |
| `role` | From `position` field (sanitized) |
| `course` | `"Common Data Environment con Trimble Connect"` |
| `campus_id` | Moodle user ID |

**`all_enrollments`** (always):

| Column | Value |
|--------|-------|
| `course_id` | 174 |
| `user_email` | From form |
| `role` | From `position` field |
| `course_group` | Assigned group (`23_ADM`, `23_OWN`, or `23_CON`) |

## Email Notifications

| Email | Recipient | Trigger |
|-------|-----------|---------|
| Internal admin notification | Admin | On every new submission |
| Enrollment confirmation | User | After successful Moodle enrollment |

Template used: `gen_mail_enrolled.ejs`

## Notes

- **No role distinction** (Student/Teacher) — unlike the Beca program, all TC users are treated the same regardless of their professional role.
- **Company category is required** for group assignment. If an unknown value is passed, the switch statement has no default, so group assignment would be skipped — this should be validated on the frontend form.
- **SharePoint integration** is present in the code but currently **disabled**.
