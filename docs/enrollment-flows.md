# Enrollment Flows — Overview

This document provides a high-level comparison of all enrollment flows supported by the system. For detailed per-program documentation, see the individual flow files.

## Programs

| Program | File |
|---------|------|
| Beca (Scholarship) | [beca-flow.md](beca-flow.md) |
| CS — Customer direct | [cs-flow.md](cs-flow.md) |
| CS — Hotmart webhook | [cs-flow.md](cs-flow.md) |
| Trimble Connect (TC) | [tc-flow.md](tc-flow.md) |
| EUDE | [eude-flow.md](eude-flow.md) |
| BIMTC | [bimtc-flow.md](bimtc-flow.md) |
| ISO 19650 | [iso-flow.md](iso-flow.md) |
| TC Certification | [tc-certification-flow.md](tc-certification-flow.md) |
| Enrollment Extension | [enrollment-extend-flow.md](enrollment-extend-flow.md) |

## Program Comparison

| Aspect | Beca | CS Customer | CS Hotmart | TC | EUDE | BIMTC | ISO 19650 | TC Cert. | Enroll. Extend |
|--------|------|-------------|------------|----|------|-------|-----------|----------|----------------|
| **Request table** | `beca_request` | `customer_enrollment_request` | `hotmart_enrollments` | `tc_request` | `eude_request` | `customer_enrollment_request` | `customer_enrollment_request` | `customer_enrollment_request` | `enrollment_extension` |
| **Enrollment trigger** | Cron job (async) | Immediate (sync) | Webhook (sync) | Immediate (sync) | Immediate (sync) | Immediate (sync) | Immediate (sync) | Immediate (sync) | Immediate (sync) |
| **Enrollment duration** | 60 days | 30 days | Variable (defined per pack) | 30 days | 30 days | 30 days | 30 days | 30 days | +1 month |
| **Multiple courses** | No | No | Yes | No | No | No | No | No | No |
| **Group assignment** | By role (Student / Teacher) | Static — Clientes 2025 | Dynamic — "Hotmart" group | By company category | Static — group 3483 | Static — group 3949 | Static — group 3987 | None (GROUP_ID = 0) | N/A |
| **Duplicate window** | Per calendar year | Permanent (any prior request) | Per transaction ID | 24 hours | 24 hours | Permanent (any prior request) | Permanent (any prior request) | Permanent (any prior request) | N/A (extensions allowed up to limit) |
| **Course selection** | User selects | User selects | Determined by Hotmart product | Fixed (TC course) | Fixed (EUDE course) | Fixed (course 251) | Fixed (course 259) | Fixed (course 249) | User selects from their enrolled courses |
| **Creates Moodle user** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| **SharePoint** | Planned (disabled) | Planned (disabled) | Not used | Planned (disabled) | Declared (unused) | Not used | Not used | Not used | Not used |

## Shared Technical Details

### Moodle Username Format

All programs generate Moodle usernames using the same pattern:

```
[first 2 chars of firstname][first 2 chars of lastname]-[last 4 digits of timestamp]
```

Example: `firstname = "Juan"`, `lastname = "Diaz"`, timestamp ends in `5042` → username = `judi-5042`

All characters are lowercased and special characters are removed beforehand.

### Special Character Replacement

Before storing or sending data to Moodle, all text fields go through character normalization:

| Original | Replaced with |
|----------|---------------|
| ñ | n |
| á | a |
| é | e |
| í | i |
| ó | o |
| ú | u |
| Á | A |
| É | E |
| Í | I |
| Ó | O |
| Ú | U |

### Common Database Tables

In addition to their program-specific request tables, all programs write to shared tracking tables:

- **`all_users`** — record of every Moodle user created by the system
- **`all_enrollments`** — record of every enrollment performed

### Email Notification Types

| Notification | Recipient | When sent |
|---|---|---|
| Reception confirmation | User | On successful form submission |
| Enrollment confirmation | User | After successful Moodle enrollment |
| Duplicate notification | User | When a duplicate request is detected (Beca only sends discount code) |
| Internal admin notification | Admin | On every new form submission |
