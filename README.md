# Prism

**Modular business intelligence dashboard by Wohlf Solutions.**

Prism is a clean, dark-themed BI dashboard built for SMB clients. Wohlf gold on
navy, KPI stat bar, revenue and orders charts, records table, AI insights bar,
and plug-in module slots for industry add-ons.

## Live Demo

[https://rixsta16.github.io/prism](https://rixsta16.github.io/prism)

## Status: v0.1 — scaffold

The Overview screen is built and runs on placeholder data. Eight other screens
are linked in the sidebar and do not exist yet. There is no routing, data
layer, authentication or module system.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full gap analysis and the phased
plan to v1.0.

## Stack

- Pure HTML/CSS/JS — zero build step
- [Chart.js 4.5](https://www.chartjs.org/) for charts
- Designed for embedding into SaaS or standalone deployment

## Documentation

| Document | What it covers |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | System shape, runtime model, decisions on record |
| [Design System](docs/DESIGN-SYSTEM.md) | Tokens, type, components, layout, accessibility |
| [Data Model](docs/DATA-MODEL.md) | Entities, metric definitions, config contract |
| [Modules](docs/MODULES.md) | Add-on contract, widget slots, catalogue |
| [Pages](docs/PAGES.md) | Every screen, its state, what it must contain |
| [Roadmap](docs/ROADMAP.md) | Built vs. not built, phases, open questions |
| [Deployment](docs/DEPLOYMENT.md) | Hosting, tenant provisioning, releases |
| [Contributing](docs/CONTRIBUTING.md) | Conventions and review checklist |

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deployment

Served via GitHub Pages from the `main` branch root.

---

*Prism by Wohlf Solutions · v0.1 scaffold*
