# Design System

Prism inherits its structural language from Mandate (`rixsta16/mandate`) and
re-skins it in the Wohlf palette: gold on deep navy, restrained, dense, more
terminal than consumer SaaS.

## Principles

- **Density over whitespace.** An operator scans this dashboard daily. Padding
  is tight, type is small, information-per-screen is high.
- **Gold is punctuation, not paint.** Gold marks the active state, the primary
  action, and the single most important number on screen. If everything is
  gold, nothing is.
- **Status colour is semantic and fixed.** Green is good, red is bad, amber is
  waiting, blue is informational. These meanings never vary by context.
- **Dark is the only theme.** Prism is not theme-switchable. A light mode would
  require a second palette with different semantic contrast and is out of scope
  through v1.0.

## Tokens

All tokens are CSS custom properties on `:root`. They are the single source of
truth: no component may hardcode a colour, radius or duration.

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0f0f1e` | App background |
| `--surface` | `#1a1a2e` | Sidebar, cards, topbar |
| `--surface-2` | `#22223b` | Raised surfaces, tooltips, hover fills |
| `--border` | `rgba(201,168,76,0.15)` | Structural borders (gold-tinted) |
| `--border-muted` | `rgba(255,255,255,0.07)` | Internal dividers, table rules |
| `--gold` | `#c9a84c` | Active state, primary action, key figure |
| `--gold-dim` | `rgba(201,168,76,0.12)` | Active backgrounds, chart fills |
| `--gold-glow` | `rgba(201,168,76,0.25)` | Focus rings, hover emphasis |
| `--text` | `#e8e4da` | Primary text |
| `--text-muted` | `#9a9aac` | Labels, secondary text, axis ticks (raised for AA) |
| `--text-dim` | `#4a4a5a` | Disabled, tertiary, footer |
| `--green` | `#2ec4a0` | Positive delta, complete, paid |
| `--red` | `#e05c6a` | Negative delta, overdue, failed |
| `--amber` | `#f0a040` | Awaiting, at-risk, pending |
| `--blue` | `#4da8e8` | Informational, in-progress, links |

### Structure

| Token | Value | Use |
| --- | --- | --- |
| `--radius` | `10px` | Cards, buttons, pills, module slots |
| `--sidebar-w` | `220px` | Sidebar width |
| `--transition` | `0.18s ease` | All hover/active transitions |

### Spacing, type and stacking

Added in Phase 1, in `tokens.css`:

| Token | Value | Replaces |
| --- | --- | --- |
| `--space-1` … `--space-6` | `4 / 8 / 12 / 16 / 24 / 32px` | Ad-hoc padding and gap values |
| `--text-xs` … `--text-xl` | `11 / 12 / 14 / 18 / 24px` | Inline `font-size` declarations |
| `--radius-sm` | `6px` | Badge and small-control corners |
| `--z-sidebar`, `--z-overlay`, `--z-toast` | `10 / 100 / 200` | The lone `z-index: 10` |

## Type

System stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
sans-serif`. No webfont — the load cost is not worth it for a dense internal
tool. Base size `14px`, line height `1.5`.

| Role | Size | Weight | Colour |
| --- | --- | --- | --- |
| Topbar title | 18px | 600 | `--text` |
| Card title | 13px | 600 | `--text` |
| Stat value | 24px | 600 | `--text` (or semantic) |
| Stat label | 11px | 500, uppercase, tracked | `--text-muted` |
| Body / table | 13–14px | 400 | `--text` |
| Meta / footer | 11px | 400 | `--text-dim` |

Numeric columns, identifiers and currency use the `.mono` class so figures
align vertically in tables.

## Layout

```mermaid
flowchart LR
    subgraph shell[".shell — flex row, 100vh"]
        direction LR
        subgraph side["sidebar · 220px fixed"]
            direction TB
            logo["logo"] --> nav["nav<br/>Workspace · Modules"] --> foot["footer<br/>user · settings · sign out"]
        end
        subgraph main["main · scrolls"]
            direction TB
            top["topbar · 56px sticky"]
            ai["ai-bar"]
            stats["stat-bar · 5 across"]
            pills["pills · period filter"]
            g2["grid-2 · revenue | orders"]
            table["card · records table"]
            g3["grid-3 · module slots"]
            top --> ai --> stats --> pills --> g2 --> table --> g3
        end
    end
```

Responsive plan — none of this exists yet:

```mermaid
flowchart TD
    w["viewport width"] --> a{"≥ 1280px"}
    a -- yes --> full["stat-bar 5 across<br/>grid-2 + grid-3 as designed"]
    a -- no --> b{"≥ 1024px"}
    b -- yes --> mid["stat-bar wraps 3 + 2"]
    b -- no --> c{"≥ 768px"}
    c -- yes --> tab["grid-2 and grid-3<br/>collapse to one column"]
    c -- no --> phone["sidebar → off-canvas drawer<br/>table scrolls horizontally"]
```

`.shell` is a full-height flex row; the sidebar is fixed-width and the main
column scrolls independently. Card grids use `grid-2` and `grid-3`.

Three breakpoints live in `assets/css/responsive.css`, loaded last so its
overrides win:

| Breakpoint | Behaviour |
| --- | --- |
| `< 1280px` | Stat bar wraps to 3 + 2 |
| `< 1024px` | `grid-2` and `grid-3` collapse to one column |
| `< 768px` | Sidebar becomes an off-canvas drawer behind a topbar toggle; data table scrolls horizontally in its own container |

## Components

| Component | Classes | Notes |
| --- | --- | --- |
| Sidebar nav item | `.nav-item`, `.nav-item.active`, `.nav-badge` | Gold left rail and `--gold-dim` fill when active. Must carry `aria-current="page"` |
| Section label | `.nav-section-label` | Uppercase, tracked, `--text-dim` |
| Topbar | `.topbar`, `.topbar-title`, `.topbar-subtitle`, `.topbar-actions` | Title is the current view; subtitle carries tenant and period |
| Button | `.btn`, `.btn-primary`, `.btn-ghost` | Primary is gold-filled and appears at most once per view |
| AI bar | `.ai-bar`, `.ai-bar-icon`, `.ai-bar-label`, `.ai-bar-text` | Full-width digest strip. Copy is generated, so it must be length-tolerant |
| Stat | `.stat`, `.stat.active`, `.stat-label`, `.stat-value`, `.stat-change`, `.stat-icon` | Clicking a stat selects the metric the charts below render. Currently only toggles a class |
| Pills | `.pills`, `.pill`, `.pill.active` | Period filter. Currently cosmetic — no filtering is wired |
| Card | `.card`, `.card-header`, `.card-title`, `.card-body`, `.card-body-flush` | Use the flush body when the child manages its own padding (tables) |
| Chart container | `.chart-container` | Fixed height; Chart.js runs with `maintainAspectRatio: false` |
| Data table | `.data-table` | Sticky header, hover rows, `.mono` numeric cells |
| Badge | `.badge` + `-green` `-amber` `-red` `-blue` `-muted` | Status pill. Colour mapping is defined in DATA-MODEL.md, not per-view |
| Module slot | `.module-slot`, `-icon`, `-name`, `-desc`, `-price` | Upsell tile for a disabled module |
| Sparkline | `.spark` | Inline micro-trend; not yet used in markup |
| Tabs | `.tabs`, `.tab` | `role="tablist"`; the active tab carries `aria-selected` |
| State block | `.state` + `-loading` `-empty` `-error` `-partial` | The four states every data component needs |
| Skeleton | `.skeleton`, `.skeleton-line`, `.skeleton-block` | Matches the final layout so nothing jumps on load |
| Form field | `.field`, `.input`, `.select`, `.switch` | Settings, Admin, Data Sources |
| Kanban | `.board`, `.board-col`, `.deal-card` | CRM pipeline board |
| Stage pipeline | `.pipeline`, `.pipeline-stage` | Production Story; `.bottleneck` marks the slowest stage |
| Source row | `.source-row` | Data Sources connection list |

### Utilities

`.flex`, `.flex-col`, `.items-center`, `.gap-2`, `.ml-auto`, `.truncate`,
`.mono`, `.text-xs`, `.text-sm`, `.font-semi`, `.font-bold`, `.text-muted`,
`.text-gold`, `.text-green`, `.text-red`.

Utilities exist for layout and colour only. Anything that is repeated three
times becomes a component class instead.

## Iconography

Inline SVG, 16×16 viewBox, `stroke="currentColor"`, `stroke-width="1.6"`, no
fill. Icons inherit their colour from the parent so active and hover states
need no icon-specific rules. Decorative icons take `aria-hidden="true"`.

Module slots use geometric glyphs (◫ ◍ ▤ ⇄) rather than emoji, which render
inconsistently across platforms and do not inherit colour. Nav icons are the
stroked SVG set, defined once in `src/app.js`.

## Accessibility

Done:

- Nav items are real routes and the active one carries `aria-current="page"`.
- Pills and stats are `<button>`: focusable, keyboard-operable, with
  `aria-selected` / `aria-pressed`. Analytics tabs use `role="tablist"`.
- A `2px` `--gold-glow` focus ring with `outline-offset: 2px` on every
  interactive element, via `:focus-visible`.
- `--text-muted` raised from `#7a7a8a` to `#9a9aac` so 11–13px body copy clears
  WCAG AA on `--surface`.
- Skip link to main content; `#view` is focusable as the landmark target.
- `prefers-reduced-motion` disables transitions and the skeleton shimmer.
- Point-in-time KPIs carry a visually-hidden note that the period filter does
  not apply to them.

Still open:

- Charts convey their data by colour alone. Each needs an adjacent
  visually-hidden table or a summary sentence.
- The off-canvas sidebar closes on Escape but does not trap focus while open.
- No audit has been run against a real screen reader.

Target: WCAG 2.1 AA before the first paying tenant.
