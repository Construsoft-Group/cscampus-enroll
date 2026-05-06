# CS Program — Enrollment Flows

The CS program has **two independent enrollment flows**:

1. **Customer direct enrollment** — triggered by a user filling out a web form (`POST /cs`)
2. **Hotmart webhook enrollment** — triggered automatically when a purchase is approved in Hotmart (`POST /cs/hotmart`)

Both flows enroll users in Moodle immediately (synchronous processing).

---

## Flow 1 — Customer Direct Enrollment

### Form Fields

| Field | Description |
|-------|-------------|
| `courseName` | Selected course name |
| `firstname` | User's first name |
| `lastname` | User's last name |
| `company` | Company name (stored as `institution`) |
| `activity` | Company activity / sector |
| `email` | Contact email (unique identifier) |
| `phone` | Phone number |
| `position` | Job position |
| `optradio` | Promotional flag (captured, not used in enrollment logic) |

### Flow

```
User submits form (POST /cs)
       │
       ▼
Check 24-hour duplicate in customer_enrollment_request
(same email within last 24 hours)
       │
   ┌───┴───┐
Duplicate  New
   │        │
   ▼        ▼
Show       Insert into customer_enrollment_request
"¡Tienes   Send internal admin notification email
una         │
solicitud  Look up course by courseName in enrollmentGroups config
en curso!"  │
            ├─ Assign group: "PROGRAMA CLIENTES TEKLA 2025" (static)
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
                       country = "Company",
                       role = "Estudiante")
       │               │
       └──────┬─────────┘
              ▼
      Enroll in course (30-day access)
      Add to "PROGRAMA CLIENTES TEKLA 2025" group
      [If TC course] Also add to "23_FULL" group
      Insert into all_enrollments
      Send enrollment confirmation email
```

### Special Case — Trimble Connect Course

If the selected course is **"CDE | Gestión y coordinación de proyectos BIM con Trimble Connect"**, the user is added to **two groups**:
1. `PROGRAMA CLIENTES TEKLA 2025`
2. `23_FULL`

### Enrollment Duration

**30 days** from the moment of form submission.

### Database Writes

**`customer_enrollment_request`**:

| Column | Value |
|--------|-------|
| `course_Id` | Moodle course ID |
| `firstname` | From form |
| `lastname` | From form |
| `company` | From form |
| `activity` | From form |
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
| `institution` | From `company` field |
| `country` | `"Company"` (static) |
| `role` | `"Estudiante"` (static) |
| `email` | From form |
| `phone` | From form |
| `course` | Selected course name |
| `campus_id` | Moodle user ID |

**`all_enrollments`** (always):

| Column | Value |
|--------|-------|
| `course_id` | Moodle course ID |
| `user_email` | From form |
| `role` | `"Estudiante"` |
| `course_group` | `"PROGRAMA CLIENTES TEKLA 2025"` |

---

## Flow 2 — Hotmart Webhook Enrollment

This flow is triggered automatically when Hotmart sends a purchase event to `POST /cs/hotmart`. It supports **multi-course packs**.

### Webhook Payload (Hotmart)

The relevant fields extracted from the Hotmart webhook are:

| Field | Description |
|-------|-------------|
| `event` | Must be `PURCHASE_APPROVED` or `PURCHASE_COMPLETE` |
| `data.purchase.status` | Must be `APPROVED` or `COMPLETED` |
| `data.buyer.email` | Buyer email |
| `data.buyer.name` | Buyer name |
| `data.purchase.transaction` | Unique transaction ID (used for deduplication) |
| `data.product.name` | Product name (matched against internal config) |

### Flow

```
Hotmart sends webhook (POST /cs/hotmart)
       │
       ▼
Validate event type and purchase status
(must be APPROVED or COMPLETED)
       │
   Invalid → return HTTP 200 "not a valid purchase" (silent)
       │
       ▼
Extract buyer and product data
Normalize product name
(lowercase, remove accents, remove punctuation)
       │
       ▼
Match product name against hotmartProducts config
(exact match first, then normalized fallback)
       │
   No match → return HTTP 200 "product not mapped" (silent)
       │
       ▼
Check transaction_id in hotmart_enrollments
       │
   Duplicate → return HTTP 200 "transaction already processed"
       │
       ▼
Query Moodle: does user exist by email?
       │
   ┌───┴───────────┐
  Yes              No
   │               │
   ▼               ▼
Get existing    Create Moodle user
Moodle user ID  Insert into all_users
                    (institution = company,
                     country = "Online",
                     course = "Multiple Courses")
       │               │
       └──────┬─────────┘
              ▼
For each course in the matched Hotmart pack:
   ├─ Find "Hotmart" group dynamically in course config
   ├─ Set enrollment dates: now → now + pack.matricula days
   ├─ Enroll user in course
   ├─ Add to "Hotmart" group
   ├─ [If TC course] Also add to group ID 2519 ("23_FULL")
   ├─ Insert into all_enrollments
   └─ Record in enrolledCourses array (or enrollmentErrors on failure)
              │
              ▼
Insert into hotmart_enrollments (one row per transaction)
Send multi-course enrollment email to user
Send internal admin summary email
Return HTTP 200 with enrollment summary JSON
```

### Product Matching

Product names from Hotmart are **normalized** before matching:
1. Convert to lowercase
2. Remove accents (á → a, etc.)
3. Remove punctuation
4. Trim whitespace

An exact match is attempted first. If it fails, the normalized version is compared against all configured product names.

### Enrollment Duration

Variable — defined by the `matricula` field in each pack configuration. Different packs can have different durations.

### Special Case — Trimble Connect

For any course identified as the Trimble Connect course, the user is also added to group ID `2519` (`23_FULL`) in addition to the standard "Hotmart" group.

### Database Writes

**`hotmart_enrollments`** (one row per transaction):

| Column | Value |
|--------|-------|
| `transaction_id` | From Hotmart webhook |
| `product_name` | Matched product name |
| `buyer_email` | From webhook |
| `enrolled_courses` | JSON array of successfully enrolled courses |
| `enrollment_errors` | JSON array of courses that failed |
| `total_courses` | Total courses in the pack |
| `successful_enrollments` | Count of successful enrollments |
| `processed_at` | Current timestamp |

**`all_users`** (only if user was new to the system)

**`all_enrollments`** (one row per course successfully enrolled)

### Email Notifications

| Email | Recipient | Content |
|-------|-----------|---------|
| Multi-course enrollment confirmation | Buyer | List of all enrolled courses with access details |
| Internal admin summary | Admin | Transaction ID, buyer, total courses, success/error counts |

---

## Notes

- **No form UI** exists for the Hotmart flow — it is fully automated via webhook.
- **Silent failures** are intentional: unrecognized products or invalid events return HTTP 200 to prevent Hotmart from retrying the webhook.
- **SharePoint integration** is present in the Customer flow code but currently **disabled**.
