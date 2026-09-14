# Contributing

## Principles

- **Read the docs before changing the code.** Metric definitions, status
  vocabulary and design tokens are contracts, not preferences. Changing one is
  a documented decision, not a diff.
- **No hardcoded data in markup.** After Phase 1 this is a review failure.
- **No hardcoded colours, radii or durations.** Use the tokens.
- **Small, single-purpose pull requests.** A design-token change and a routing
  change do not belong together.

## Branches

- `main` is deployable at all times.
- Work on descriptive branches: `feat/router`, `fix/stat-contrast`,
  `docs/data-model`.
- Merge by pull request. Open it as a draft while work is in progress.

## Commits

Conventional prefixes, imperative mood, one logical change each.

```
feat:  new capability
fix:   corrected behaviour
docs:  documentation only
style: formatting, no behaviour change
refactor: restructuring, no behaviour change
chore: tooling, deps, housekeeping
```

## Code conventions

### CSS

- Tokens in `tokens.css`; nothing else defines a raw colour.
- Component classes are flat and semantic (`.stat-value`), not abstract
  (`.text-24-bold`).
- Utilities are for layout and colour only. Anything repeated three times
  becomes a component class.
- Keep the existing banner-comment sectioning — it is the reason a 1,100-line
  file is still navigable.

### JavaScript

- ES modules, no bundler, no framework.
- One view per file, default-exporting `{ mount, unmount }`.
- `unmount` destroys every chart, interval and listener the view created.
- All text from the data layer is inserted with `textContent`. Client names and
  record references are untrusted input.
- No `innerHTML` with interpolated data. Ever.
- Formatting via `format.js` only, so one number reads the same everywhere.

### Markup

- Interactive controls are `<button>` or `<a href>`. Not `<div>` with a click
  handler — this is the most common defect in the current scaffold.
- Decorative SVG takes `aria-hidden="true"`.
- The active nav item takes `aria-current="page"`.

## Review checklist

Before requesting review:

- [ ] Renders correctly at 1440px, 1024px and 375px
- [ ] Keyboard-only: every control reachable, focus visible, Enter and Space work
- [ ] Loading, empty and error states exist for any new data component
- [ ] No new hardcoded colour, spacing or data value
- [ ] Charts created in this change are destroyed on unmount
- [ ] Tenant-specific values come from config, not markup
- [ ] Docs updated if a contract changed (tokens, metrics, statuses, module API)
- [ ] No console errors on load or on navigating in and out of the view twice

## Adding a module

See MODULES.md. In short: implement the contract object, register the id in
`prism.config.example.js`, add a catalogue entry, and verify the module is
completely invisible — no nav entry, no request — when it is not enabled.
