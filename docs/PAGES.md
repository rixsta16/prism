# Pages

Every screen Prism advertises, its current state, and what it must contain.
The sidebar in the v0.1 scaffold links to seven destinations. **One of them
exists.** The rest are `href="#"`.

| Screen | Route | State |
| --- | --- | --- |
| Overview | `#/overview` | Built, placeholder data |
| Analytics | `#/analytics` | Not built |
| Reports | `#/reports` | Not built — sidebar shows a badge of `2` |
| Data Sources | `#/data-sources` | Not built |
| Admin Panel | `#/admin` | Not built |
| Production Story | `#/modules/production-story` | Not built |
| CRM + Pipeline | `#/modules/crm-pipeline` | Not built |
| Settings | `#/settings` | Not built |
| Sign out | — | No auth exists |

---

## Overview — built

The only complete screen. Top to bottom: AI digest bar, five-stat KPI bar,
period pills, revenue trend + orders-by-status charts, recent records table,
module upsell slots, footer.

Working: layout, both charts, pill and stat active-state toggling.

Not working:
- Every number is hardcoded in markup or in the chart config.
- Pills toggle a class and filter nothing.
- Stats toggle a class and change nothing below them.
- `View all` and `Refresh` are inert.
- Module slots are not clickable despite reading "Click to enable".
- AI digest text is a static placeholder.
- Tenant placeholders (`<!-- CLIENT_NAME -->` etc.) render as empty strings, so
  the topbar subtitle currently reads as a bare dash.

## Analytics — not built

Deeper cuts of the same data. Proposed contents:

- Tabbed sections: Revenue, Orders, Clients, Pipeline.
- Revenue: trend with a comparison overlay for the previous period, breakdown
  by record type, top clients by contribution.
- Orders: throughput over time, status mix trend, average cycle time.
- Clients: new vs. returning, revenue concentration (share held by the top five
  — a genuine risk signal for an SMB), dormancy list.
- Every chart exports its underlying rows to CSV.

## Reports — not built

The sidebar badge of `2` implies two reports are waiting. Nothing generates
them.

- Report list: name, period, generated date, format.
- Scheduled reports: weekly digest, month-end summary.
- On-demand generation with a period picker.
- Output as PDF (print stylesheet first — a print stylesheet is cheap and
  removes any PDF dependency) and CSV.

## Data Sources — not built

Where a tenant connects their data. This screen is what makes Prism a product
rather than a bespoke page.

- Connected sources with status, last sync time, record counts.
- Add a source: CSV upload, REST endpoint, or an integration (Xero, QuickBooks,
  Shopify).
- Field mapping: map the tenant's columns onto Prism entities. Non-negotiable —
  no two SMBs name their columns the same way.
- Sync history with failures and their reasons.

## Admin Panel — not built

- Tenant profile and branding.
- Users and roles (owner, operator, viewer).
- Module enable/disable, which writes `config.modules`.
- Data source configuration.
- Audit log.

Gated behind a role check that does not yet exist.

## Settings — not built

User-scoped, distinct from Admin's tenant scope.

- Profile, password, notification preferences.
- Locale, currency and timezone display overrides.
- Default landing view and default period.

## Sign out — no auth

The scaffold has no authentication at all. See the security posture in
ARCHITECTURE.md: Prism is not a security boundary and must sit behind an
authenticating host before any real data is loaded.

## Empty, loading and error states

None of these exist anywhere, and they are the states a new tenant sees first.
Every data-bearing component needs all four:

| State | Requirement |
| --- | --- |
| **Loading** | Skeleton matching the final layout, not a spinner — the layout must not jump |
| **Empty** | Explains why it is empty and gives one action ("Connect a data source") |
| **Error** | States what failed and offers a retry; never a raw stack trace |
| **Partial** | One source failed while others succeeded: render what loaded and mark the gap |

A brand-new tenant with no data connected currently sees five zeros, two
charts of invented numbers, and five rows about companies that do not exist.
That is the single worst first impression in the product.
